import { NextRequest, NextResponse } from "next/server"
import {
  sendConsultantWelcomeEmail,
  sendNewCommissionEmail,
  sendPaymentApprovedEmail,
  sendNewClientLinkedEmail,
  sendMonthlyReportEmail,
} from "@/lib/resend"
import type { Consultant, Client, Commission } from "@/types/consultant"

export async function GET(request: NextRequest) {
  try {
    // Test consultant data
    const testConsultant: Consultant = {
      id: "test-consultant-id",
      code: "CONS0001",
      status: "ACTIVE" as any,
      firstName: "Maria",
      lastName: "Silva",
      email: "test@example.com", // Change to your test email
      phone: "+351912345678",
      birthDate: "1990-01-01",
      nif: "123456789",
      iban: "PT50000201231234567890154",
      bankName: "Banco Exemplo",
      address: {
        street: "Rua Exemplo",
        number: "123",
        complement: "Apt 4B",
        city: "Lisboa",
        state: "Lisboa",
        postalCode: "1000-001",
        country: "PT",
      },
      joinDate: "2024-01-01",
      commissionRate: 15,
      clientIds: [],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    }

    // Test client data
    const testClient: Client = {
      id: "test-client-id",
      consultantId: "test-consultant-id",
      status: "ACTIVE" as any,
      firstName: "Ana",
      lastName: "Costa",
      email: "client@example.com",
      phone: "+351923456789",
      registrationDate: "2024-01-15T00:00:00Z",
      lastPurchaseDate: "2024-01-20T00:00:00Z",
      totalPurchases: 5,
      totalSpent: 250.50,
      createdAt: "2024-01-15T00:00:00Z",
      updatedAt: "2024-01-20T00:00:00Z",
    }

    // Test commission data
    const testCommission: Commission = {
      id: "test-commission-id",
      consultantId: "test-consultant-id",
      orderId: "order-123",
      clientId: "test-client-id",
      status: "APPROVED" as any,
      orderAmount: 150.00,
      commissionRate: 15,
      commissionAmount: 22.50,
      orderDate: "2024-01-20T00:00:00Z",
      approvalDate: "2024-01-21T00:00:00Z",
      paymentDate: "2024-01-22T00:00:00Z",
      orderDetails: {
        orderNumber: "ORD-2024-0001",
        customerName: "Ana Costa",
        items: [
          { name: "Colar Prata", quantity: 1, price: 75.00 },
          { name: "Brincos Dourados", quantity: 2, price: 37.50 },
        ],
      },
      createdAt: "2024-01-20T00:00:00Z",
      updatedAt: "2024-01-22T00:00:00Z",
    }

    // Test report data
    const testReportData = {
      month: "Janeiro",
      year: 2024,
      totalCommissions: 15,
      totalEarnings: 458.75,
      newClients: 3,
      topClients: [
        { ...testClient, totalSpent: 350.00 },
        { ...testClient, firstName: "João", lastName: "Santos", totalSpent: 280.00 },
        { ...testClient, firstName: "Rita", lastName: "Pereira", totalSpent: 195.50 },
      ],
      commissions: [testCommission],
    }

    // Send test emails
    const results = {
      welcome: await sendConsultantWelcomeEmail(testConsultant, "TempPass123!"),
      newCommission: await sendNewCommissionEmail(testConsultant, testCommission),
      paymentApproved: await sendPaymentApprovedEmail(testConsultant, testCommission),
      newClient: await sendNewClientLinkedEmail(testConsultant, testClient),
      monthlyReport: await sendMonthlyReportEmail(testConsultant, testReportData),
    }

    return NextResponse.json({
      message: "Test emails sent",
      results,
    })
  } catch (error) {
    console.error("Error sending test emails:", error)
    return NextResponse.json(
      { error: "Failed to send test emails", details: error },
      { status: 500 }
    )
  }
}