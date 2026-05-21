import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";

const colors = {
  main: "#070A0D",
  background: "#0F1314",
  white: "#FFFFFF",
  grey: "#9FA1A1",
  accent: "#A7D1FE",
  stroke: "#2F394B",
};

export type EmailLayoutProps = {
  preview: string;
  siteUrl: string;
  children: ReactNode;
  afterCard?: ReactNode;
};

const buildFontFaceStyles = (siteUrl: string) => {
  const base = siteUrl.replace(/\/$/, "");
  const regular = `${base}/Urbanist/Urbanist-Regular.ttf`;
  return `
    @font-face {
      font-family: 'Urbanist';
      font-style: normal;
      font-weight: 400;
      src: url('${regular}') format('truetype');
    }
    @font-face {
      font-family: 'Urbanist';
      font-style: normal;
      font-weight: 500;
      src: url('${regular}') format('truetype');
    }
  `;
};

export const EmailLayout = ({ preview, siteUrl, children, afterCard }: EmailLayoutProps) => (
  <Html>
    <Head>
      <style>{buildFontFaceStyles(siteUrl)}</style>
    </Head>
    <Preview>{preview}</Preview>
    <Body style={bodyStyle}>
      <Container style={containerStyle}>
        <Section style={cardStyle}>{children}</Section>
        {afterCard}
        <Hr style={hrStyle} />
        <Text style={footerStyle}>
          <Link href={siteUrl} style={footerLinkStyle}>
            {siteUrl.replace(/^https?:\/\//, "")}
          </Link>
          {" · "}Collective patent enforcement funding
        </Text>
      </Container>
    </Body>
  </Html>
);

const bodyStyle: CSSProperties = {
  margin: 0,
  padding: "32px 16px",
  backgroundColor: colors.main,
  fontFamily: "Urbanist, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const containerStyle: CSSProperties = {
  margin: "0 auto",
  maxWidth: "560px",
};

const cardStyle: CSSProperties = {
  backgroundColor: colors.background,
  borderRadius: "20px",
  border: `1px solid ${colors.stroke}`,
  padding: 0,
  overflow: "hidden",
};

const hrStyle: CSSProperties = {
  borderColor: colors.stroke,
  margin: "32px 0 16px",
};

const footerStyle: CSSProperties = {
  margin: 0,
  fontSize: "12px",
  lineHeight: "1.4",
  color: colors.grey,
  textAlign: "center" as const,
};

const footerLinkStyle: CSSProperties = {
  color: colors.accent,
  textDecoration: "none",
};
