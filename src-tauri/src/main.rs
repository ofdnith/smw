// Empacotamento nativo (macOS) do jogo: uma janela WebView com o build do Vite.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o Lumi");
}
