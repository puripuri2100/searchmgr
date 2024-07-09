// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use parse_md::MarkdonwBlock;
use setup_data::DataWithId;

mod parse_md;
mod setup_data;

#[tauri::command]
fn parse_markdown(text: &str) -> Vec<MarkdonwBlock> {
    parse_md::parse_markdown(text)
}
#[tauri::command]
async fn read_project_file(binary: Vec<u8>) -> Result<DataWithId, String> {
    let data = setup_data::parse_bson(binary).await?;
    Ok(data)
}

#[tauri::command]
fn write_project_file(data: DataWithId) -> Result<Vec<u8>, String> {
    setup_data::write_bson(data)
}
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            parse_markdown,
            read_project_file,
            write_project_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
