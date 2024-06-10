// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::*;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    let export = CustomMenuItem::new("export".to_string(), "Export");
    let import = CustomMenuItem::new("import".to_string(), "Import");
    let save= CustomMenuItem::new("save".to_string(), "Save");
    let filemenu = Submenu::new("File", Menu::new().add_item(export).add_item(import).add_item(save));

    let menu = Menu::new().add_submenu(filemenu);
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .menu(menu)
        .on_menu_event(|event| match event.menu_item_id() {
            "export" => {
                let window = event.window();
                window.emit("export", "export".to_string()).unwrap();
            }
            "import" => {
                let window = event.window();
                window.emit("import", "import".to_string()).unwrap();
            }
            "save" => {
                let window = event.window();
                window.emit("save", "save".to_string()).unwrap();
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
