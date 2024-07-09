export type config = {
  now_open_file_name: string | null;
};

export type text_file_type =
  | "text"
  | "rust"
  | "tex"
  | "json"
  | "toml"
  | "yaml"
  | "c"
  | "cpp"
  | "ocaml"
  | "satysfi"
  | "any_text_file";

export type text_file = {
  file_type: text_file_type;
  file_name: string;
  contents: string;
};

export type binary_file_type = "png" | "jpeg" | "pdf";

export type binary_file = {
  file_type: binary_file_type;
  file_name: string;
  contents: number[];
};

export function is_binary_file(file_type: string): boolean {
  if (file_type == "png" || file_type == "jpeg" || file_type == "pdf") {
    return true;
  } else {
    return false;
  }
}

export type data = {
  title: string;
  book_name: string;
  url: string;
  keywords: string[];
  text_files: text_file[];
  binary_files: binary_file[];
  memo: string;
  created_at: string;
  last_edit: string;
};

export type data_with_id = {
  id: string;
  searchmgr_version: string;
  data: data[];
};

export type open_file_data = {
  data_index: number;
  file_index: number;
  file_data: binary_file | text_file;
};

export type markdown_inline = {
  type:
    | "text"
    | "inline_code"
    | "inline_math"
    | "display_math"
    | "emphasis"
    | "strong"
    | "strike"
    | "br"
    | "link"
    | "image";
  string: string | null;
  text: markdown_inline[] | null;
  link: string | null;
};

export type markdown_block = {
  type: "paragraph" | "rule" | "heading" | "block_code" | "quote" | "ol" | "ul";
  text: markdown_inline[] | null;
  start: number | null;
  level: number | null;
  lang: string | null;
  code: string | null;
  children: markdown_list[] | null;
  quote_children: markdown_block[] | null;
};

export type markdown_list = {
  type: "ol" | "ul" | "item";
  children: markdown_list[] | null;
  text: markdown_inline[] | null;
  check: boolean | null;
  start: number | null;
};
