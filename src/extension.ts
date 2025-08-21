import * as vscode from "vscode"

export function activate(context: vscode.ExtensionContext) {
  console.log("Curly Scope Highlighter Activated!")

  let isEnabled = true
  let highlightDecoration: vscode.TextEditorDecorationType | null = null

  const SUPPORTED_LANGUAGES = [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "java",
    "c",
    "cpp",
    "csharp",
    "go",
  ]

  // !  Style oh highlight

  function getHighlightDecoration() {
    // * settings.json
    // * {
    // *  "curly-scope-highlighter.highlightColor": "255, 0, 0",
    // *  "curly-scope-highlighter.opacity": 0.1
    // * }

    const config = vscode.workspace.getConfiguration("curly-scope-highlighter")
    const color = config.get<string>("highlightColor", "0, 100, 100")
    const opacity = config.get<number>("opacity", 0.07)

    return vscode.window.createTextEditorDecorationType({
      backgroundColor: `rgba(${color}, ${opacity})`,
      isWholeLine: true,
    })
  }

  // !  Update highlight

  function updateHighlighting(editor: vscode.TextEditor | undefined) {
    if (!editor || !SUPPORTED_LANGUAGES.includes(editor.document.languageId)) {
      return
    }

    if (!isEnabled) {
      if (highlightDecoration) {
        editor.setDecorations(highlightDecoration, [])
      }
      return
    }

    const ranges = findAllBlockRanges(editor.document)
    if (ranges.length > 0 && highlightDecoration) {
      editor.setDecorations(highlightDecoration, ranges)
    }
  }

  function applyNewHighlighting() {
    if (highlightDecoration) {
      highlightDecoration.dispose()
    }
    highlightDecoration = getHighlightDecoration()
    updateHighlighting(vscode.window.activeTextEditor)
  }

  vscode.workspace.onDidChangeConfiguration((event) => {
    if (
      event.affectsConfiguration("curly-scope-highlighter.highlightColor") ||
      event.affectsConfiguration("curly-scope-highlighter.opacity")
    ) {
      applyNewHighlighting()
    }
  })

  // ! Toggle

  const toggleCommand = vscode.commands.registerCommand(
    "curly-scope-highlighter.enable",
    () => {
      isEnabled = !isEnabled
      vscode.window.showInformationMessage(
        `Easy Scope ${isEnabled ? "Enabled" : "Disabled"}`
      )
      updateHighlighting(vscode.window.activeTextEditor)
    }
  )

  vscode.workspace.onDidChangeTextDocument((event) => {
    if (vscode.window.activeTextEditor?.document === event.document) {
      updateHighlighting(vscode.window.activeTextEditor)
    }
  })

  vscode.window.onDidChangeActiveTextEditor((editor) =>
    updateHighlighting(editor)
  )

  applyNewHighlighting()
  context.subscriptions.push(toggleCommand)
}

//  ! Finding all nested { blocks }
export function findAllBlockRanges(
  document: vscode.TextDocument
): vscode.Range[] {
  const text = document.getText()
  const ranges: vscode.Range[] = []
  const stack: number[] = [] // Стек позиций

  for (let i = 0; i < text.length; i++) {
    if (text[i] === "{") {
      stack.push(i + 1) // Начало диапазона после {
    } else if (text[i] === "}") {
      if (stack.length > 0) {
        const start = stack.pop()!
        const startPosition = document.positionAt(start) // Начало диапазона
        const endPosition = document.positionAt(i) // Конец диапазона
        // Проверяем, что `{` и `}` не на одной строке
        if (startPosition.line !== endPosition.line) {
          let end = i - 1
          // Отодвигаем end назад, чтобы не включать '}'
          while (end > 0 && /\s/.test(text[end])) {
            end--
          }
          // Сдвигаем start и end, чтобы не захватывать сами скобки
          const finalStartPosition = document.positionAt(start + 1)
          const finalEndPosition = document.positionAt(end)
          ranges.push(new vscode.Range(finalStartPosition, finalEndPosition))
        }
      }
    }
  }

  return ranges
}

// export function findAllBlockRanges(
//   document: vscode.TextDocument
// ): vscode.Range[] {
//   const text = document.getText()
//   const ranges: vscode.Range[] = []
//   const stack: number[] = [] // Стек позиций '{'

//   for (let i = 0; i < text.length; i++) {
//     if (text[i] === "{") {
//       stack.push(i + 1) // Начало диапазона после
//     } else if (text[i] === "}") {
//       if (stack.length > 0) {
//         const start = stack.pop()! + 2
//         let end = i - 1
//         // Отодвигаем end назад, чтобы не включать
//         while (end > 0 && /\s/.test(text[end])) {
//           end--
//         }

//         const startPosition = document.positionAt(start)
//         const endPosition = document.positionAt(end + 1) // +1, чтобы не терять последний символ перед }
//         ranges.push(new vscode.Range(startPosition, endPosition))
//       }
//     }
//   }

//   return ranges
// }

export function deactivate() {}
