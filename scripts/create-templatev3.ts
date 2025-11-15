import * as ExcelJS from 'exceljs'
import { join } from 'path'
import { writeFileSync } from 'fs'

async function createTemplateV3() {
    const sourcePath = join(process.cwd(), 'resources', 'templatev2.xlsx')
    const targetPath = join(process.cwd(), 'resources', 'templatev3.xlsx')

    console.log('Loading source template...')
    const sourceWorkbook = new ExcelJS.Workbook()
    await sourceWorkbook.xlsx.readFile(sourcePath)

    const sourceWorksheet = sourceWorkbook.getWorksheet('Results')
    if (!sourceWorksheet) {
        throw new Error('Results worksheet not found in source template')
    }

    console.log(`Source worksheet has ${sourceWorksheet.rowCount} rows`)
    console.log('Creating new template with first 40 rows (A-F)...')

    // Create new workbook
    const newWorkbook = new ExcelJS.Workbook()

    // Create new Results worksheet
    const newWorksheet = newWorkbook.addWorksheet('Results')

    // Copy rows 1-40, columns A-F (1-6)
    const maxRow = Math.min(40, sourceWorksheet.rowCount)
    const columnsToCopy = [1, 2, 3, 4, 5, 6] // A, B, C, D, E, F

    // First, copy all cells with values and styles
    for (let rowNum = 1; rowNum <= maxRow; rowNum++) {
        const sourceRow = sourceWorksheet.getRow(rowNum)
        const newRow = newWorksheet.getRow(rowNum)

        // Copy row height
        if (sourceRow.height) {
            newRow.height = sourceRow.height
        }

        // Copy each cell in columns A-F
        for (const colNum of columnsToCopy) {
            const sourceCell = sourceRow.getCell(colNum)
            const newCell = newRow.getCell(colNum)

            // Copy value (even if empty, we need to preserve the cell)
            newCell.value = sourceCell.value

            // Copy all style properties comprehensively
            // Get the style from the model for complete information
            const sourceModel = sourceCell.model
            if (sourceModel && sourceModel.style) {
                const sourceStyle = sourceModel.style
                
                // Copy font (all properties)
                if (sourceStyle.font) {
                    newCell.font = {
                        name: sourceStyle.font.name,
                        size: sourceStyle.font.size,
                        family: sourceStyle.font.family,
                        scheme: sourceStyle.font.scheme,
                        charset: sourceStyle.font.charset,
                        color: sourceStyle.font.color ? { ...sourceStyle.font.color } : undefined,
                        bold: sourceStyle.font.bold,
                        italic: sourceStyle.font.italic,
                        underline: sourceStyle.font.underline,
                        strike: sourceStyle.font.strike,
                        outline: sourceStyle.font.outline,
                        shadow: sourceStyle.font.shadow,
                        vertAlign: sourceStyle.font.vertAlign
                    }
                }
                
                // Copy alignment (including text wrapping)
                if (sourceStyle.alignment) {
                    newCell.alignment = {
                        horizontal: sourceStyle.alignment.horizontal,
                        vertical: sourceStyle.alignment.vertical,
                        textRotation: sourceStyle.alignment.textRotation,
                        wrapText: sourceStyle.alignment.wrapText, // This is the text wrapping property
                        indent: sourceStyle.alignment.indent,
                        readingOrder: sourceStyle.alignment.readingOrder,
                        shrinkToFit: sourceStyle.alignment.shrinkToFit
                    }
                }
                
                // Copy border
                if (sourceStyle.border) {
                    newCell.border = {
                        top: sourceStyle.border.top ? { ...sourceStyle.border.top } : undefined,
                        left: sourceStyle.border.left ? { ...sourceStyle.border.left } : undefined,
                        bottom: sourceStyle.border.bottom ? { ...sourceStyle.border.bottom } : undefined,
                        right: sourceStyle.border.right ? { ...sourceStyle.border.right } : undefined,
                        diagonal: sourceStyle.border.diagonal ? { ...sourceStyle.border.diagonal } : undefined
                    }
                }
                
                // Copy fill
                if (sourceStyle.fill) {
                    newCell.fill = {
                        type: sourceStyle.fill.type,
                        fgColor: sourceStyle.fill.fgColor ? { ...sourceStyle.fill.fgColor } : undefined,
                        bgColor: sourceStyle.fill.bgColor ? { ...sourceStyle.fill.bgColor } : undefined,
                        pattern: sourceStyle.fill.pattern
                    }
                }
                
                // Copy number format
                if (sourceStyle.numFmt) {
                    newCell.numFmt = sourceStyle.numFmt
                }
                
                // Copy protection
                if (sourceStyle.protection) {
                    newCell.protection = { ...sourceStyle.protection }
                }
            } else if (sourceCell.style) {
                // Fallback: copy style properties directly if model is not available
                if (sourceCell.style.font) newCell.font = sourceCell.style.font
                if (sourceCell.style.alignment) newCell.alignment = sourceCell.style.alignment
                if (sourceCell.style.border) newCell.border = sourceCell.style.border
                if (sourceCell.style.fill) newCell.fill = sourceCell.style.fill
                if (sourceCell.style.numFmt) newCell.numFmt = sourceCell.style.numFmt
            }

            // Copy additional properties from model
            if (sourceModel) {
                // Copy formula if present
                if (sourceModel.formula) {
                    newCell.formula = sourceModel.formula
                }
                // Note: hyperlink is read-only, skip it
            }
        }
    }

    // Copy merged cells that are within our range (rows 1-40, columns A-F)
    // ExcelJS stores merges in worksheet.model.merges as an array of merge objects
    const sourceModel = sourceWorksheet.model
    if (sourceModel.merges && Array.isArray(sourceModel.merges)) {
        console.log(`Found ${sourceModel.merges.length} merged cell ranges in source`)
        
        // Helper function to parse Excel cell address to row/col
        const parseCellAddress = (address: string): { row: number; col: number } => {
            const match = address.match(/([A-Z]+)(\d+)/)
            if (!match) throw new Error(`Invalid cell address: ${address}`)
            
            const colLetters = match[1]
            const rowNum = parseInt(match[2], 10)
            
            // Convert column letters to number (A=1, B=2, ..., Z=26, AA=27, etc.)
            let colNum = 0
            for (let i = 0; i < colLetters.length; i++) {
                colNum = colNum * 26 + (colLetters.charCodeAt(i) - 64)
            }
            
            return { row: rowNum, col: colNum }
        }
        
        for (const merge of sourceModel.merges) {
            try {
                let startRow: number, startCol: number, endRow: number, endCol: number
                
                if (merge.s && merge.e) {
                    // Standard format: { s: { r, c }, e: { r, c } }
                    startRow = (merge.s.r ?? merge.s.row ?? 0) + 1 // Convert to 1-based
                    startCol = (merge.s.c ?? merge.s.col ?? 0) + 1
                    endRow = (merge.e.r ?? merge.e.row ?? 0) + 1
                    endCol = (merge.e.c ?? merge.e.col ?? 0) + 1
                } else if (typeof merge === 'string') {
                    // Range string format like "A1:E1" or "A1:B2"
                    const [startAddr, endAddr] = merge.split(':')
                    const start = parseCellAddress(startAddr)
                    const end = parseCellAddress(endAddr)
                    startRow = start.row
                    startCol = start.col
                    endRow = end.row
                    endCol = end.col
                } else {
                    console.warn('Unknown merge format:', merge)
                    continue
                }

                // Only copy merges that are within our range (rows 1-40, columns 1-6)
                if (startRow <= maxRow && startCol <= 6 && endCol <= 6) {
                    newWorksheet.mergeCells(startRow, startCol, endRow, endCol)
                    console.log(`Copied merge: row ${startRow}-${endRow}, col ${startCol}-${endCol}`)
                }
            } catch (error) {
                console.warn(`Failed to process merge:`, merge, error)
            }
        }
    } else {
        console.log('No merged cells found in source worksheet')
    }

    // Copy column widths for columns A-F
    for (const colNum of columnsToCopy) {
        const sourceCol = sourceWorksheet.getColumn(colNum)
        const newCol = newWorksheet.getColumn(colNum)

        if (sourceCol.width) {
            newCol.width = sourceCol.width
        }
    }

    // Save the new template
    console.log('Saving new template...')
    const buffer = await newWorkbook.xlsx.writeBuffer()
    writeFileSync(targetPath, buffer)

    console.log(`Template created successfully at: ${targetPath}`)
    console.log(`Copied ${maxRow} rows with columns A-F`)
}

createTemplateV3()
    .then(() => {
        console.log('Done!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('Error:', error)
        process.exit(1)
    })

