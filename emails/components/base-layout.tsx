import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface BaseLayoutProps {
  preview: string;
  heading: string;
  children: React.ReactNode;
  appUrl: string;
  appName: string;
}

/**
 * Shared shell for every transactional email. All templates compose this so
 * branding and structure live in exactly one place.
 */
export function BaseLayout({
  preview,
  heading,
  children,
  appUrl,
  appName,
}: BaseLayoutProps): React.JSX.Element {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Text style={styles.brand}>{appName}</Text>
          </Section>

          <Heading style={styles.heading}>{heading}</Heading>

          {children}

          <Hr style={styles.hr} />

          <Text style={styles.footer}>
            Manage your bookings at{" "}
            <Link href={appUrl} style={styles.link}>
              {appUrl}
            </Link>
          </Text>
          <Text style={styles.footerMuted}>
            This is an automated message from {appName}. Please do not reply
            directly to this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// ─────────────────────────────────────────────────────────────
// Shared detail row primitives
// ─────────────────────────────────────────────────────────────

export interface DetailRow {
  label: string;
  value: string;
}

export function DetailList({ rows }: { rows: DetailRow[] }): React.JSX.Element {
  return (
    <Section style={styles.detailBox}>
      {rows.map((row) => (
        <Text key={row.label} style={styles.detailRow}>
          <span style={styles.detailLabel}>{row.label}: </span>
          <span style={styles.detailValue}>{row.value}</span>
        </Text>
      ))}
    </Section>
  );
}

export function Paragraph({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <Text style={styles.paragraph}>{children}</Text>;
}

export function CalloutBox({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <Section style={styles.callout}>
      <Text style={styles.calloutText}>{children}</Text>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

export const styles = {
  body: {
    backgroundColor: "#f4f5f7",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    margin: 0,
    padding: "24px 0",
  } as React.CSSProperties,
  container: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    margin: "0 auto",
    maxWidth: "600px",
    padding: "32px",
  } as React.CSSProperties,
  header: {
    paddingBottom: "8px",
  } as React.CSSProperties,
  brand: {
    color: "#4f46e5",
    fontSize: "14px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    margin: 0,
    textTransform: "uppercase",
  } as React.CSSProperties,
  heading: {
    color: "#111827",
    fontSize: "22px",
    fontWeight: 700,
    lineHeight: "30px",
    margin: "8px 0 16px",
  } as React.CSSProperties,
  paragraph: {
    color: "#374151",
    fontSize: "15px",
    lineHeight: "24px",
    margin: "0 0 16px",
  } as React.CSSProperties,
  detailBox: {
    backgroundColor: "#f9fafb",
    borderRadius: "6px",
    margin: "0 0 16px",
    padding: "16px",
  } as React.CSSProperties,
  detailRow: {
    color: "#374151",
    fontSize: "14px",
    lineHeight: "22px",
    margin: "0 0 4px",
  } as React.CSSProperties,
  detailLabel: {
    color: "#6b7280",
    fontWeight: 600,
  } as React.CSSProperties,
  detailValue: {
    color: "#111827",
  } as React.CSSProperties,
  callout: {
    backgroundColor: "#fff7ed",
    borderLeft: "4px solid #f97316",
    borderRadius: "4px",
    margin: "0 0 16px",
    padding: "12px 16px",
  } as React.CSSProperties,
  calloutText: {
    color: "#7c2d12",
    fontSize: "14px",
    lineHeight: "22px",
    margin: 0,
  } as React.CSSProperties,
  hr: {
    borderColor: "#e5e7eb",
    margin: "24px 0 16px",
  } as React.CSSProperties,
  footer: {
    color: "#6b7280",
    fontSize: "13px",
    lineHeight: "20px",
    margin: "0 0 4px",
  } as React.CSSProperties,
  footerMuted: {
    color: "#9ca3af",
    fontSize: "12px",
    lineHeight: "18px",
    margin: 0,
  } as React.CSSProperties,
  link: {
    color: "#4f46e5",
    textDecoration: "underline",
  } as React.CSSProperties,
} as const;
