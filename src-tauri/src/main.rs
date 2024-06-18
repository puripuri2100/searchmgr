// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use parse_md::MarkdonwBlock;

mod parse_md;

#[tauri::command]
fn parse_markdown(text: &str) -> Vec<MarkdonwBlock> {
    let v = parse_md::parse_markdown(text);
    v
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![parse_markdown])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
