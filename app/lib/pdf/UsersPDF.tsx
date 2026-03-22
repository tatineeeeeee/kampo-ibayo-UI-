import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
} from "@react-pdf/renderer";
import { styles, columnWidths } from "./pdfStyles";
import {
  PDFExportable,
  LOGO_URL,
  formatDate,
  formatPhoneNumber,
} from "./helpers";

// =====================
// USERS PDF DOCUMENT
// =====================
interface UsersPDFProps {
  data: PDFExportable[];
  title: string;
  generatedAt: string;
}

export const UsersPDFDocument: React.FC<UsersPDFProps> = ({
  data,
  title,
  generatedAt,
}) => {
  const totalUsers = data.length;
  const adminCount = data.filter((u) => u.role === "admin").length;
  const staffCount = data.filter((u) => u.role === "staff").length;
  const userCount = data.filter((u) => u.role === "user" || !u.role).length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image style={styles.logo} src={LOGO_URL} />
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>Kampo Ibayo Resort</Text>
              <Text style={styles.companyTagline}>User Database</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.reportTitle}>{title}</Text>
            <Text style={styles.reportMeta}>Generated: {generatedAt}</Text>
            <Text style={styles.reportMeta}>Total Users: {totalUsers}</Text>
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Users</Text>
            <Text style={styles.summaryValue}>{totalUsers}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Admins</Text>
            <Text style={styles.summaryValue}>{adminCount}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Staff</Text>
            <Text style={styles.summaryValue}>{staffCount}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Users</Text>
            <Text style={styles.summaryValue}>{userCount}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableHeader} minPresenceAhead={40}>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: columnWidths.users.name },
              ]}
            >
              Full Name
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: columnWidths.users.email },
              ]}
            >
              Email Address
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: columnWidths.users.phone },
              ]}
            >
              Phone Number
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: columnWidths.users.registered },
              ]}
            >
              Registered On
            </Text>
          </View>

          {/* Data Rows */}
          {data.map((user, index) => (
            <View
              key={index}
              wrap={false}
              style={[
                styles.tableRow,
                index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
              ]}
            >
              <Text
                style={[styles.tableCell, { width: columnWidths.users.name }]}
              >
                {String(user.name || "")}
              </Text>
              <Text
                style={[styles.tableCell, { width: columnWidths.users.email }]}
              >
                {String(user.email || "")}
              </Text>
              <Text
                style={[styles.tableCell, { width: columnWidths.users.phone }]}
              >
                {formatPhoneNumber(user.phone as string)}
              </Text>
              <Text
                style={[
                  styles.tableCell,
                  { width: columnWidths.users.registered },
                ]}
              >
                {formatDate(user.created_at as string)}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Kampo Ibayo Resort - Confidential User Data
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
};
