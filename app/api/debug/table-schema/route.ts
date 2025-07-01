import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkIsAdmin } from "@/lib/security/check-admin"

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const admin = await checkIsAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const supabase = await createClient()

    // Get table name from query params
    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get('table') || 'products'

    // Query to get column information from PostgreSQL
    const { data: columns, error } = await supabase
      .rpc('get_table_columns', { table_name: tableName })

    if (error) {
      // If the function doesn't exist, try a direct query
      const { data: tableInfo, error: tableError } = await supabase
        .from(tableName)
        .select('*')
        .limit(0)

      if (tableError) {
        return NextResponse.json({ 
          error: `Erro ao obter schema da tabela: ${tableError.message}` 
        }, { status: 400 })
      }

      // This won't give us column info, but at least confirms table exists
      return NextResponse.json({
        table: tableName,
        exists: true,
        message: 'Tabela existe mas não foi possível obter detalhes das colunas',
        hint: 'Use as colunas documentadas no schema-validator.ts'
      })
    }

    return NextResponse.json({
      table: tableName,
      columns: columns || [],
      total: columns?.length || 0
    })

  } catch (error: any) {
    console.error('Error in GET /api/debug/table-schema:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const admin = await checkIsAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const supabase = await createClient()

    // Test insert with the provided data
    const tableName = body.table || 'products'
    const testData = body.data || {}

    // Try to insert (with dryRun to not actually insert)
    const { error } = await supabase
      .from(tableName)
      .insert(testData)
      .select()
      .single()

    if (error) {
      // Parse error to find which columns are invalid
      const errorMessage = error.message
      const invalidColumns: string[] = []
      
      // Common patterns for column errors
      if (errorMessage.includes('column') && errorMessage.includes('does not exist')) {
        // Extract column name from error like: column "standard_price" does not exist
        const match = errorMessage.match(/column "([^"]+)" does not exist/)
        if (match) {
          invalidColumns.push(match[1])
        }
      }

      return NextResponse.json({
        valid: false,
        error: errorMessage,
        invalidColumns,
        hint: 'Verifique as colunas válidas em /api/debug/table-schema?table=' + tableName
      })
    }

    return NextResponse.json({
      valid: true,
      message: 'Dados válidos para inserção'
    })

  } catch (error: any) {
    console.error('Error in POST /api/debug/table-schema:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}