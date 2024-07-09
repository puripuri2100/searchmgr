// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use parse_md::MarkdonwBlock;
use setup_data::{BinaryFile, DataWithId};
use uuid::Uuid;

mod parse_md;
mod setup_data;

#[tauri::command]
fn parse_markdown(text: &str) -> Vec<MarkdonwBlock> {
    parse_md::parse_markdown(text)
}

#[tauri::command]
fn print_temp(path: &str) -> String {
    println!("{path}");
    "Ok".to_string()
}

#[tauri::command]
fn write_binary_file(
    app_data_path: &str,
    project_id: Uuid,
    file_path: &str,
) -> Result<BinaryFile, String> {
    setup_data::write_binary_file(app_data_path, &project_id, file_path)
}

#[tauri::command]
async fn read_project_file(app_data_path: &str, file_path: &str) -> Result<DataWithId, String> {
    let parse_data = setup_data::parse_bson(file_path).await?;
    let data = setup_data::parse_data_to_data(app_data_path, parse_data).await?;
    Ok(data)
}

#[tauri::command]
fn write_bson(file_path: &str, data: DataWithId) -> Result<(), String> {
    setup_data::write_bson(file_path, data)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            parse_markdown,
            print_temp,
            write_binary_file,
            read_project_file,
            write_bson
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
