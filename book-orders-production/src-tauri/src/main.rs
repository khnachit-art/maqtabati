#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::path::PathBuf;
use tauri::{
  command, AppHandle, Emitter, Manager, Runtime, State, WindowEvent,
};
use tauri_plugin_sql::{Migration, MigrationKind};
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;
use base64::{Engine as _, engine::general_purpose};
use image::ImageFormat;
use std::io::Cursor;

// ---------- Database Models ----------
#[derive(Debug, Serialize, Deserialize)]
struct Book {
  id: Option<i64>,
  title: String,
  subject: String,
  level: String,
  school_id: Option<i64>,
  created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct School {
  id: Option<i64>,
  name: String,
  region: String,
  created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Customer {
  id: Option<i64>,
  name: String,
  phone: String,
  email: String,
  address: String,
  created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Order {
  id: Option<i64>,
  school_id: i64,
  customer_id: Option<i64>,
  customer_name: String,
  phone: String,
  notes: String,
  status: String,
  cmd_number: Option<String>,
  created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct OrderItem {
  id: Option<i64>,
  order_id: i64,
  book_id: i64,
  quantity: i64,
  received: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
struct AggregatedBook {
  book_id: i64,
  title: String,
  subject: String,
  level: String,
  total_quantity: i64,
  school_count: i64,
  schools: Vec<String>,
  customer_names: Vec<String>,
  is_unreceived: Option<bool>,
}

// ---------- App State ----------
struct AppState {
  db_path: PathBuf,
  app_data_dir: PathBuf,
}

// ---------- Commands ----------

#[command]
async fn get_app_info() -> Result<serde_json::Value, String> {
  Ok(serde_json::json!({
    "name": "Maqtabati",
    "version": "1.0.0",
    "description": "إدارة وتجميع طلبات الكتب المدرسية"
  }))
}

#[command]
async fn get_database_path(state: State<'_, AppState>) -> Result<String, String> {
  Ok(state.db_path.to_string_lossy().to_string())
}

#[command]
async fn backup_database(state: State<'_, AppState>) -> Result<String, String> {
  let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S").to_string();
  let backup_name = format!("dev_backup_{}.db", timestamp);
  let backup_path = state.app_data_dir.join(&backup_name);

  std::fs::copy(&state.db_path, &backup_path)
    .map_err(|e| format!("فشل النسخ الاحتياطي: {}", e))?;

  Ok(backup_path.to_string_lossy().to_string())
}

#[command]
async fn reset_database(state: State<'_, AppState>) -> Result<String, String> {
  // Delete the database file
  if state.db_path.exists() {
    std::fs::remove_file(&state.db_path)
      .map_err(|e| format!("فشل حذف قاعدة البيانات: {}", e))?;
  }

  // Recreate it by running migrations
  // The SQL plugin will handle this on next connection
  Ok("تم إعادة تعيين قاعدة البيانات. أعد تشغيل التطبيق لتطبيق الترحيلات.".to_string())
}

#[command]
async fn delete_all_books(state: State<'_, AppState>) -> Result<i64, String> {
  let conn = rusqlite::Connection::open(&state.db_path)
    .map_err(|e| format!("فشل فتح قاعدة البيانات: {}", e))?;

  let count = conn.execute("DELETE FROM books", [])
    .map_err(|e| format!("فشل حذف الكتب: {}", e))?;

  Ok(count)
}

#[command]
async fn delete_books_by_level(state: State<'_, AppState>, level: String) -> Result<i64, String> {
  let conn = rusqlite::Connection::open(&state.db_path)
    .map_err(|e| format!("فشل فتح قاعدة البيانات: {}", e))?;

  let count = conn.execute("DELETE FROM books WHERE level = ?1", [level])
    .map_err(|e| format!("فشل حذف كتب المستوى {}: {}", level, e))?;

  Ok(count)
}

#[command]
async fn delete_books_by_school(state: State<'_, AppState>, school_id: i64) -> Result<i64, String> {
  let conn = rusqlite::Connection::open(&state.db_path)
    .map_err(|e| format!("فشل فتح قاعدة البيانات: {}", e))?;

  let count = conn.execute("DELETE FROM books WHERE school_id = ?1", [school_id])
    .map_err(|e| format!("فشل حذف كتب المدرسة {}: {}", school_id, e))?;

  Ok(count)
}

#[command]
async fn add_book(
  state: State<'_, AppState>,
  title: String,
  subject: String,
  level: String,
  school_id: Option<i64>,
) -> Result<i64, String> {
  let conn = rusqlite::Connection::open(&state.db_path)
    .map_err(|e| format!("فشل فتح قاعدة البيانات: {}", e))?;

  conn.execute(
    "INSERT INTO books (title, subject, level, school_id, created_at) VALUES (?1, ?2, ?3, ?4, datetime('now'))",
    [title, subject, level, school_id.map(|v| v.to_string()).unwrap_or_default()],
  ).map_err(|e| format!("فشل إضافة الكتاب: {}", e))?;

  let id = conn.last_insert_rowid();
  Ok(id)
}

#[command]
async fn update_book(
  state: State<'_, AppState>,
  id: i64,
  title: String,
  subject: String,
  level: String,
  school_id: Option<i64>,
) -> Result<bool, String> {
  let conn = rusqlite::Connection::open(&state.db_path)
    .map_err(|e| format!("فشل فتح قاعدة البيانات: {}", e))?;

  let count = conn.execute(
    "UPDATE books SET title = ?1, subject = ?2, level = ?3, school_id = ?4 WHERE id = ?5",
    [title, subject, level, school_id.map(|v| v.to_string()).unwrap_or_default(), id.to_string()],
  ).map_err(|e| format!("فشل تحديث الكتاب: {}", e))?;

  Ok(count > 0)
}

#[command]
async fn delete_book(state: State<'_, AppState>, id: i64) -> Result<bool, String> {
  let conn = rusqlite::Connection::open(&state.db_path)
    .map_err(|e| format!("فشل فتح قاعدة البيانات: {}", e))?;

  let count = conn.execute("DELETE FROM books WHERE id = ?1", [id])
    .map_err(|e| format!("فشل حذف الكتاب: {}", e))?;

  Ok(count > 0)
}

#[command]
async fn get_books(
  state: State<'_, AppState>,
  level: Option<String>,
  subject: Option<String>,
) -> Result<Vec<Book>, String> {
  let conn = rusqlite::Connection::open(&state.db_path)
    .map_err(|e| format!("فشل فتح قاعدة البيانات: {}", e))?;

  let mut query = String::from(
    "SELECT id, title, subject, level, school_id, created_at FROM books WHERE 1=1"
  );
  let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

  if let Some(l) = level {
    query.push_str(" AND level = ?");
    params.push(Box::new(l));
  }
  if let Some(s) = subject {
    query.push_str(" AND subject = ?");
    params.push(Box::new(s));
  }
  query.push_str(" ORDER BY level, subject, title");

  let mut stmt = conn.prepare(&query)
    .map_err(|e| format!("فشل إعداد الاستعلام: {}", e))?;

  let books_iter = stmt.query_map(
    rusqlite::params_from_iter(params.iter()),
    |row| Ok(Book {
      id: row.get(0)?,
      title: row.get(1)?,
      subject: row.get(2)?,
      level: row.get(3)?,
      school_id: row.get(4)?,
      created_at: row.get(5)?,
    })
  ).map_err(|e| format!("فشل تنفيذ الاستعلام: {}", e))?;

  let mut books = Vec::new();
  for book in books_iter {
    books.push(book.map_err(|e| format!("فشل قراءة الصف: {}", e))?);
  }

  Ok(books)
}

#[command]
async fn get_schools(state: State<'_, AppState>) -> Result<Vec<School>, String> {
  let conn = rusqlite::Connection::open(&state.db_path)
    .map_err(|e| format!("فشل فتح قاعدة البيانات: {}", e))?;

  let mut stmt = conn.prepare(
    "SELECT id, name, region, created_at FROM schools ORDER BY name"
  ).map_err(|e| format!("فشل إعداد الاستعلام: {}", e))?;

  let schools_iter = stmt.query_map([], |row| Ok(School {
    id: row.get(0)?,
    name: row.get(1)?,
    region: row.get(2)?,
    created_at: row.get(3)?,
  })).map_err(|e| format!("فشل تنفيذ الاستعلام: {}", e))?;

  let mut schools = Vec::new();
  for school in schools_iter {
    schools.push(school.map_err(|e| format!("فشل قراءة الصف: {}", e))?);
  }

  Ok(schools)
}

#[command]
async fn add_school(
  state: State<'_, AppState>,
  name: String,
  region: String,
) -> Result<i64, String> {
  let conn = rusqlite::Connection::open(&state.db_path)
    .map_err(|e| format!("فشل فتح قاعدة البيانات: {}", e))?;

  conn.execute(
    "INSERT INTO schools (name, region, created_at) VALUES (?1, ?2, datetime('now'))",
    [name, region],
  ).map_err(|e| format!("فشل إضافة المدرسة: {}", e))?;

  Ok(conn.last_insert_rowid())
}

#[command]
async fn import_books_from_excel(
  state: State<'_, AppState>,
  file_path: String,
  school_id: Option<i64>,
  default_level: Option<String>,
) -> Result<ImportResult, String> {
  use calamine::{Reader, Xlsx};

  let mut workbook: Xlsx<_> = calamine::open_workbook(&file_path)
    .map_err(|e| format!("فشل فتح ملف Excel: {}", e))?;

  let mut created = 0;
  let mut skipped = 0;
  let mut errors = Vec::new();

  for sheet_name in workbook.sheet_names() {
    if let Some(Ok(range)) = workbook.worksheet_range(&sheet_name) {
      // Try to infer level from sheet name
      let level = default_level.clone().or_else(|| infer_level_from_sheet(&sheet_name));

      for (row_idx, row) in range.rows().enumerate() {
        if row_idx == 0 { continue; } // Skip header

        let title = row.get(0).map(|c| c.to_string().trim().to_string()).unwrap_or_default();
        if title.is_empty() || title.len() < 2 { continue; }

        let subject = row.get(1).map(|c| c.to_string().trim().to_string()).unwrap_or_else(|| "عام".to_string());
        let level = level.clone().or_else(|| row.get(2).map(|c| c.to_string().trim().to_string())).unwrap_or_else(|| "CP".to_string());

        let conn = rusqlite::Connection::open(&state.db_path)
          .map_err(|e| format!("فشل فتح قاعدة البيانات: {}", e))?;

        match conn.execute(
          "INSERT INTO books (title, subject, level, school_id, created_at) VALUES (?1, ?2, ?3, ?4, datetime('now'))",
          [title.clone(), subject, level, school_id.map(|v| v.to_string()).unwrap_or_default()],
        ) {
          Ok(_) => created += 1,
          Err(e) => {
            skipped += 1;
            errors.push(format!("{}: {}", title, e));
          }
        }
      }
    }
  }

  Ok(ImportResult { created, skipped, errors })
}

#[derive(Serialize)]
struct ImportResult {
  created: i64,
  skipped: i64,
  errors: Vec<String>,
}

fn infer_level_from_sheet(sheet: &str) -> Option<String> {
  let sheet_upper = sheet.to_uppercase();
  let levels = [
    "CP", "CE1", "CE2", "CM1", "CM2", "CE6",
    "1AC", "2AC", "3AC", "TC SC", "1BAC SC EXP", "1BAC SC MATHS",
    "1BAC SC PC", "1BAC SEG ECO", "2BAC SC EXP", "2BAC SC MATHS",
    "2BAC SC PC", "2BAC SEG ECO", "PS", "MS", "GS"
  ];
  for level in levels {
    if sheet_upper.contains(&level.to_uppercase()) {
      return Some(level.to_string());
    }
  }
  None
}

#[command]
async fn get_aggregated_report(
  state: State<'_, AppState>,
  show_all: bool,
  cmd_number: Option<String>,
  level: Option<String>,
) -> Result<Vec<AggregatedBook>, String> {
  let conn = rusqlite::Connection::open(&state.db_path)
    .map_err(|e| format!("فشل فتح قاعدة البيانات: {}", e))?;

  let mut query = String::from(
    r#"
    SELECT
      b.id as book_id,
      b.title,
      b.subject,
      b.level,
      SUM(oi.quantity) as total_quantity,
      COUNT(DISTINCT o.school_id) as school_count,
      GROUP_CONCAT(DISTINCT s.name) as schools,
      GROUP_CONCAT(DISTINCT o.customer_name) as customer_names
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN books b ON oi.book_id = b.id
    LEFT JOIN schools s ON o.school_id = s.id
    WHERE 1=1
    "#
  );

  let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

  if !show_all {
    query.push_str(" AND o.status = 'pending'");
  }

  if let Some(cmd) = cmd_number {
    query.push_str(" AND o.cmd_number = ?");
    params.push(Box::new(cmd));
  }

  if let Some(l) = level {
    query.push_str(" AND b.level = ?");
    params.push(Box::new(l));
  }

  query.push_str(" GROUP BY b.id, b.title, b.subject, b.level ORDER BY b.level, b.subject, b.title");

  let mut stmt = conn.prepare(&query)
    .map_err(|e| format!("فشل إعداد الاستعلام: {}", e))?;

  let rows = stmt.query_map(
    rusqlite::params_from_iter(params.iter()),
    |row| Ok(AggregatedBook {
      book_id: row.get(0)?,
      title: row.get(1)?,
      subject: row.get(2)?,
      level: row.get(3)?,
      total_quantity: row.get(4)?,
      school_count: row.get(5)?,
      schools: row.get::<_, Option<String>>(6)?.unwrap_or_default().split(',').map(|s| s.to_string()).collect(),
      customer_names: row.get::<_, Option<String>>(7)?.unwrap_or_default().split(',').map(|s| s.to_string()).collect(),
      is_unreceived: None,
    })
  ).map_err(|e| format!("فشل تنفيذ الاستعلام: {}", e))?;

  let mut result = Vec::new();
  for row in rows {
    result.push(row.map_err(|e| format!("فشل قراءة الصف: {}", e))?);
  }

  Ok(result)
}

#[command]
async fn get_unreceived_books(state: State<'_, AppState>) -> Result<Vec<AggregatedBook>, String> {
  let conn = rusqlite::Connection::open(&state.db_path)
    .map_err(|e| format!("فشل فتح قاعدة البيانات: {}", e))?;

  let query = r#"
    SELECT
      b.id as book_id,
      b.title,
      b.subject,
      b.level,
      SUM(oi.quantity) as total_quantity,
      COUNT(DISTINCT o.school_id) as school_count,
      GROUP_CONCAT(DISTINCT s.name) as schools,
      GROUP_CONCAT(DISTINCT o.customer_name) as customer_names
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN books b ON oi.book_id = b.id
    LEFT JOIN schools s ON o.school_id = s.id
    WHERE o.status = 'sent' AND (oi.received IS NULL OR oi.received = 0)
    GROUP BY b.id, b.title, b.subject, b.level
    ORDER BY b.level, b.subject, b.title
  "#;

  let mut stmt = conn.prepare(query)
    .map_err(|e| format!("فشل إعداد الاستعلام: {}", e))?;

  let rows = stmt.query_map([], |row| Ok(AggregatedBook {
    book_id: row.get(0)?,
    title: row.get(1)?,
    subject: row.get(2)?,
    level: row.get(3)?,
    total_quantity: row.get(4)?,
    school_count: row.get(5)?,
    schools: row.get::<_, Option<String>>(6)?.unwrap_or_default().split(',').map(|s| s.to_string()).collect(),
    customer_names: row.get::<_, Option<String>>(7)?.unwrap_or_default().split(',').map(|s| s.to_string()).collect(),
    is_unreceived: Some(true),
  })).map_err(|e| format!("فشل تنفيذ الاستعلام: {}", e))?;

  let mut result = Vec::new();
  for row in rows {
    result.push(row.map_err(|e| format!("فشل قراءة الصف: {}", e))?);
  }

  Ok(result)
}

// ---------- Logo Management ----------
#[command]
async fn get_logo(state: State<'_, AppState>) -> Result<Option<String>, String> {
  let logo_path = state.app_data_dir.join("logo.png");
  if logo_path.exists() {
    let data = std::fs::read(&logo_path)
      .map_err(|e| format!("فشل قراءة اللوجو: {}", e))?;
    let b64 = general_purpose::STANDARD.encode(&data);
    Ok(Some(format!("data:image/png;base64,{}", b64)))
  } else {
    Ok(None)
  }
}

#[command]
async fn set_logo(state: State<'_, AppState>, base64_data: String) -> Result<bool, String> {
  // Remove data URL prefix if present
  let b64 = base64_data.strip_prefix("data:image/png;base64,")
    .or_else(|| base64_data.strip_prefix("data:image/jpeg;base64,"))
    .unwrap_or(&base64_data);

  let data = general_purpose::STANDARD.decode(b64)
    .map_err(|e| format!("فشل فك تشفير الصورة: {}", e))?;

  // Validate and resize image
  let img = image::load_from_memory(&data)
    .map_err(|e| format!("ملف صورة غير صالح: {}", e))?;

  let resized = img.resize(200, 200, image::imageops::FilterType::Lanczos3);
  let mut buf = Vec::new();
  resized.write_to(&mut Cursor::new(&mut buf), ImageFormat::Png)
    .map_err(|e| format!("فشل معالجة الصورة: {}", e))?;

  let logo_path = state.app_data_dir.join("logo.png");
  std::fs::write(&logo_path, &buf)
    .map_err(|e| format!("فشل حفظ اللوجو: {}", e))?;

  Ok(true)
}

#[command]
async fn remove_logo(state: State<'_, AppState>) -> Result<bool, String> {
  let logo_path = state.app_data_dir.join("logo.png");
  if logo_path.exists() {
    std::fs::remove_file(&logo_path)
      .map_err(|e| format!("فشل حذف اللوجو: {}", e))?;
  }
  Ok(true)
}

// ---------- Settings ----------
#[derive(Serialize, Deserialize)]
struct AppSettings {
  company_name: String,
  company_phone: String,
  company_email: String,
  company_address: String,
}

#[command]
async fn get_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
  let settings_path = state.app_data_dir.join("settings.json");
  if settings_path.exists() {
    let data = std::fs::read_to_string(&settings_path)
      .map_err(|e| format!("فشل قراءة الإعدادات: {}", e))?;
    let settings: AppSettings = serde_json::from_str(&data)
      .map_err(|e| format!("فشل تحليل الإعدادات: {}", e))?;
    Ok(settings)
  } else {
    Ok(AppSettings {
      company_name: "Maqtabati".to_string(),
      company_phone: "+212 0776730934".to_string(),
      company_email: "maqtabati@gmail.com".to_string(),
      company_address: "".to_string(),
    })
  }
}

#[command]
async fn save_settings(state: State<'_, AppState>, settings: AppSettings) -> Result<bool, String> {
  let settings_path = state.app_data_dir.join("settings.json");
  let data = serde_json::to_string_pretty(&settings)
    .map_err(|e| format!("فشل تسلسل الإعدادات: {}", e))?;
  std::fs::write(&settings_path, data)
    .map_err(|e| format!("فشل حفظ الإعدادات: {}", e))?;
  Ok(true)
}

// ---------- Main ----------
fn main() {
  let mut builder = tauri::Builder::default()
    .plugin(tauri_plugin_sql::Builder::new()
      .add_migrations("sqlite:maqtabati.db", vec![
        Migration {
          version: 1,
          description: "create_initial_tables",
          sql: include_str!("../migrations/001_initial.sql"),
          kind: MigrationKind::Up,
        }
      ])
      .build())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_clipboard_manager::init())
    .manage(AppState {
      db_path: PathBuf::new(),
      app_data_dir: PathBuf::new(),
    })
    .setup(|app| {
      let handle = app.handle();

      // Get app data directory
      let app_data_dir = handle
        .path()
        .app_data_dir()
        .expect("Failed to get app data dir");

      std::fs::create_dir_all(&app_data_dir).ok();

      let db_path = app_data_dir.join("maqtabati.db");

      // Initialize state
      if let Some(state) = handle.try_state::<AppState>() {
        let mut state = state.inner();
        state.db_path = db_path.clone();
        state.app_data_dir = app_data_dir.clone();
      }

      // Copy default logo if not exists
      let logo_path = app_data_dir.join("logo.png");
      if !logo_path.exists() {
        if let Some(resource_dir) = handle.path().resource_dir().ok() {
          let default_logo = resource_dir.join("logo.png");
          if default_logo.exists() {
            std::fs::copy(default_logo, logo_path).ok();
          }
        }
      }

      // Show window when ready
      if let Some(window) = handle.get_webview_window("main") {
        window.show().ok();
        window.set_focus().ok();
      }

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      get_app_info,
      get_database_path,
      backup_database,
      reset_database,
      delete_all_books,
      delete_books_by_level,
      delete_books_by_school,
      add_book,
      update_book,
      delete_book,
      get_books,
      get_schools,
      add_school,
      import_books_from_excel,
      get_aggregated_report,
      get_unreceived_books,
      get_logo,
      set_logo,
      remove_logo,
      get_settings,
      save_settings,
    ]);

  builder.run(tauri::generate_context!())
    .expect("error while running tauri application");
}