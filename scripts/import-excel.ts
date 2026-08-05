import ExcelJS from "exceljs";
import path from "path";
import { createSentenceCard } from "../src/lib/cards";

interface Args {
  filePath: string;
  sheet?: string;
  skipHeader: boolean;
  swap: boolean;
}

function parseArgs(argv: string[]): Args | null {
  const positional: string[] = [];
  let sheet: string | undefined;
  let skipHeader = false;
  let swap = false;

  for (const arg of argv) {
    if (arg.startsWith("--sheet=")) {
      sheet = arg.slice("--sheet=".length);
    } else if (arg === "--skip-header") {
      skipHeader = true;
    } else if (arg === "--swap") {
      swap = true;
    } else {
      positional.push(arg);
    }
  }

  if (positional.length !== 1) {
    console.error(
      "使い方: npm run import -- <path/to/file.xlsx> [--sheet=シート名] [--skip-header] [--swap]"
    );
    console.error(
      "  --skip-header  1行目が見出し行の場合に指定"
    );
    console.error(
      "  --swap         A列が和訳・B列が英文の場合に指定（デフォルトはA列=英文, B列=和訳）"
    );
    process.exitCode = 1;
    return null;
  }

  return { filePath: positional[0], sheet, skipHeader, swap };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args) return;

  const filePath = path.resolve(process.cwd(), args.filePath);
  console.log(`読み込み中: ${filePath}`);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  console.log(`シート数: ${workbook.worksheets.length} (${workbook.worksheets.map((s) => s.name).join(", ")})`);

  const worksheet = args.sheet
    ? workbook.getWorksheet(args.sheet)
    : workbook.worksheets[0];

  if (!worksheet) {
    console.error(`シートが見つかりませんでした: ${args.sheet ?? "(1枚目)"}`);
    process.exitCode = 1;
    return;
  }

  console.log(`対象シート: ${worksheet.name}, 行数: ${worksheet.rowCount}`);

  let imported = 0;
  let skipped = 0;
  let rowNumber = 0;

  worksheet.eachRow((row) => {
    rowNumber += 1;
    if (args.skipHeader && rowNumber === 1) return;

    const colA = row.getCell(1).text?.trim() ?? "";
    const colB = row.getCell(2).text?.trim() ?? "";

    if (!colA && !colB) {
      skipped += 1;
      return;
    }
    if (!colA || !colB) {
      console.warn(`行 ${rowNumber}: 英文または和訳が空のためスキップしました`);
      skipped += 1;
      return;
    }

    const english = args.swap ? colB : colA;
    const japanese = args.swap ? colA : colB;

    createSentenceCard(english, japanese);
    imported += 1;
  });

  console.log(`インポート完了: ${imported}件登録, ${skipped}件スキップ`);
}

main().catch((error) => {
  console.error("インポート中にエラーが発生しました:", error);
  process.exitCode = 1;
});