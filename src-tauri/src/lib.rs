use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::io::{Read, Write};
use std::net::TcpListener;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

#[derive(Serialize, Deserialize)]
pub struct GoogleAuthResponse {
    pub access_token: String,
    pub email: Option<String>,
    pub name: Option<String>,
}

#[derive(Deserialize)]
struct TokenResponse {
    access_token: String,
}

#[derive(Deserialize)]
struct UserInfoResponse {
    email: Option<String>,
    name: Option<String>,
}

fn generate_pkce() -> (String, String) {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let verifier = format!("screennotes_pkce_verifier_{}_secure_token_random", nanos);

    let mut hasher = Sha256::new();
    hasher.update(verifier.as_bytes());
    let hash = hasher.finalize();
    let challenge = URL_SAFE_NO_PAD.encode(hash);

    (verifier, challenge)
}

#[tauri::command]
async fn google_login(client_id: String, client_secret: Option<String>) -> Result<GoogleAuthResponse, String> {
    let client_id = client_id.trim().to_string();
    if client_id.is_empty() {
        return Err("El Client ID no puede estar vacío".into());
    }

    let default_secret = "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";
    let effective_secret = match client_secret {
        Some(ref s) if !s.trim().is_empty() => s.trim(),
        _ => default_secret,
    };

    let (verifier, challenge) = generate_pkce();
    let redirect_uri = "http://127.0.0.1:8085";

    let listener = TcpListener::bind("127.0.0.1:8085")
        .map_err(|e| format!("No se pudo abrir el puerto local para el inicio de sesión: {}. Asegúrate de que no haya otra instancia abierta.", e))?;

    listener
        .set_nonblocking(false)
        .map_err(|e| e.to_string())?;

    let auth_url = format!(
        "https://accounts.google.com/o/oauth2/v2/auth?client_id={}&redirect_uri={}&response_type=code&scope=https://www.googleapis.com/auth/calendar.events.readonly%20email%20profile&code_challenge={}&code_challenge_method=S256&access_type=offline&prompt=consent",
        client_id, redirect_uri, challenge
    );

    // Abrir navegador
    open::that(&auth_url).map_err(|e| format!("No se pudo abrir el navegador: {}", e))?;

    // Esperar la conexión de vuelta desde el navegador
    let (mut stream, _) = listener
        .accept()
        .map_err(|e| format!("Error esperando respuesta de Google: {}", e))?;

    let mut buffer = [0; 2048];
    let bytes_read = stream
        .read(&mut buffer)
        .map_err(|e| format!("Error leyendo respuesta del navegador: {}", e))?;
    let request_str = String::from_utf8_lossy(&buffer[..bytes_read]);

    let mut code_opt = None;
    if let Some(first_line) = request_str.lines().next() {
        if let Some(query_start) = first_line.find("code=") {
            let after_code = &first_line[query_start + 5..];
            let code_end = after_code
                .find('&')
                .or_else(|| after_code.find(' '))
                .unwrap_or(after_code.len());
            code_opt = Some(after_code[..code_end].to_string());
        }
    }

    let html_body = r#"<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>ScreenNotes - Autenticado</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #18181b; padding: 40px; border-radius: 20px; border: 1px solid #27272a; text-align: center; max-width: 400px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
    h1 { color: #38bdf8; font-size: 24px; margin-bottom: 12px; }
    p { color: #a1a1aa; font-size: 15px; line-height: 1.5; }
    .badge { display: inline-block; background: #0284c7; color: white; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-top: 18px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>¡Sesión iniciada con éxito! 🎉</h1>
    <p>Google Calendar se vinculó correctamente con <strong>ScreenNotes</strong>.</p>
    <div class="badge">Ya puedes cerrar esta pestaña</div>
  </div>
</body>
</html>"#;

    let response = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        html_body.len(),
        html_body
    );
    let _ = stream.write_all(response.as_bytes());
    let _ = stream.flush();

    let code = match code_opt {
        Some(c) => c,
        None => {
            return Err("No se encontró el código de autorización en la respuesta de Google.".into())
        }
    };

    let http_client = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;

    let token_params = [
        ("client_id", client_id.as_str()),
        ("client_secret", effective_secret),
        ("code", code.as_str()),
        ("code_verifier", verifier.as_str()),
        ("grant_type", "authorization_code"),
        ("redirect_uri", redirect_uri),
    ];

    let token_res = http_client
        .post("https://oauth2.googleapis.com/token")
        .form(&token_params)
        .send()
        .await
        .map_err(|e| format!("Error contactando el servidor de tokens de Google: {}", e))?;

    if !token_res.status().is_success() {
        let err_text = token_res.text().await.unwrap_or_default();
        return Err(format!("Google rechazó el token: {}", err_text));
    }

    let token_data: TokenResponse = token_res
        .json()
        .await
        .map_err(|e| format!("Error decodificando respuesta de token: {}", e))?;

    let user_info: Option<UserInfoResponse> = match http_client
        .get("https://www.googleapis.com/oauth2/v2/userinfo")
        .bearer_auth(&token_data.access_token)
        .send()
        .await
    {
        Ok(r) => r.json::<UserInfoResponse>().await.ok(),
        Err(_) => None,
    };

    Ok(GoogleAuthResponse {
        access_token: token_data.access_token,
        email: user_info.as_ref().and_then(|u| u.email.clone()),
        name: user_info.as_ref().and_then(|u| u.name.clone()),
    })
}

#[tauri::command]
async fn fetch_google_events(access_token: String) -> Result<String, String> {
    let access_token = access_token.trim();
    if access_token.is_empty() {
        return Err("No hay token de sesión de Google".into());
    }

    let now_iso = chrono_lite_now();
    let url = format!(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin={}&singleEvents=true&orderBy=startTime&maxResults=15",
        now_iso
    );

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(12))
        .build()
        .map_err(|e| e.to_string())?;

    let res = client
        .get(&url)
        .bearer_auth(access_token)
        .send()
        .await
        .map_err(|e| format!("Error de conexión al obtener eventos: {}", e))?;

    let status = res.status();
    if status.as_u16() == 401 {
        return Err("SESSION_EXPIRED".to_string());
    }
    if !status.is_success() {
        return Err(format!("Google Calendar API error: HTTP {}", status.as_u16()));
    }

    let body = res
        .text()
        .await
        .map_err(|e| format!("Error leyendo eventos: {}", e))?;

    Ok(body)
}

fn chrono_lite_now() -> String {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    let adjusted = if now > 1200 { now - 1200 } else { now };

    let secs = adjusted % 60;
    let mins = (adjusted / 60) % 60;
    let hours = (adjusted / 3600) % 24;
    let days = adjusted / 86400;

    let mut year = 1970;
    let mut remaining_days = days;
    loop {
        let leap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
        let days_in_year = if leap { 366 } else { 365 };
        if remaining_days < days_in_year {
            break;
        }
        remaining_days -= days_in_year;
        year += 1;
    }

    let leap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
    let month_days = [
        31,
        if leap { 29 } else { 28 },
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31,
    ];
    let mut month = 1;
    for &d in &month_days {
        if remaining_days < d {
            break;
        }
        remaining_days -= d;
        month += 1;
    }
    let day = remaining_days + 1;

    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
        year, month, day, hours, mins, secs
    )
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![google_login, fetch_google_events])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
