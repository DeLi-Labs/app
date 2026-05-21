import { Button, Column, Heading, Hr, Img, Link, Row, Section, Text } from "@react-email/components";
import type { CSSProperties } from "react";
import { EmailLayout } from "./components/EmailLayout";

export type SubscribeWelcomeEmailProps = {
  siteUrl?: string;
};

const colors = {
  white: "#FFFFFF",
  grey: "#9FA1A1",
  accent: "#A7D1FE",
  accentDark: "#070A0D",
  stroke: "#2F394B",
  chipBorder: "rgba(167, 210, 255, 0.4)",
};

const FEATURES = [
  "First-look at open patent cases",
  "Tokenized funder shares & milestone unlocks",
  "Direct on-chain participation",
];

const buildAssetUrl = (siteUrl: string, path: string) => `${siteUrl.replace(/\/$/, "")}${path}`;

export const SubscribeWelcomeEmail = ({ siteUrl = "http://localhost:3000" }: SubscribeWelcomeEmailProps) => {
  const bannerSrc = buildAssetUrl(siteUrl, "/assets/bg-2-email.png");
  const logoIconSrc = buildAssetUrl(siteUrl, "/assets/logo-vector.png");
  const wordmarkSrc = buildAssetUrl(siteUrl, "/assets/deli%20labs.png");

  return (
    <EmailLayout
      preview="Thanks for joining. We're in private beta — your invite is coming."
      siteUrl={siteUrl}
      afterCard={
        <Section style={wordmarkSectionStyle}>
          <Img src={wordmarkSrc} alt="DeLi labs" width="280" height="70" style={wordmarkImgStyle} />
        </Section>
      }
    >
      <Section style={bannerHeroSectionStyle}>
        <Row>
          <Column style={bannerHeroColumnStyle(bannerSrc)}>
            <Link href={siteUrl} style={logoLinkStyle}>
              <Row style={logoRowStyle}>
                <Column style={logoWordColumnFirstStyle}>
                  <Text style={logoWordStyle}>deli</Text>
                </Column>
                <Column style={logoIconColumnStyle}>
                  <Img src={logoIconSrc} alt="" width="32" height="32" style={logoIconStyle} />
                </Column>
                <Column style={logoWordColumnLastStyle}>
                  <Text style={logoWordStyle}>labs</Text>
                </Column>
              </Row>
            </Link>
          </Column>
        </Row>
      </Section>

      <Section style={contentSectionStyle}>
        <Text style={chipStyle}>PRIVATE BETA</Text>

        <Heading style={headingStyle}>Thanks for joining the early list.</Heading>

        <Text style={leadStyle}>
          We genuinely appreciate your interest in DeLi. We&apos;re currently in private beta on devnet — building, polishing, and
          onboarding our first cohort.
        </Text>

        <Text style={bodyStyle}>
          The moment we open public access, you&apos;ll get an email here with your invite. No extra signup, no extra
          steps. <span style={emphasisStyle}>Stay tuned.</span>
        </Text>

        <Hr style={dividerStyle} />

        <Text style={featuresLabelStyle}>What you&apos;ll get when we open</Text>

        {FEATURES.map(feature => (
          <Row key={feature} style={featureRowStyle}>
            <Column style={bulletColumnStyle}>
              <div style={bulletDotStyle} />
            </Column>
            <Column>
              <Text style={featureTextStyle}>{feature}</Text>
            </Column>
          </Row>
        ))}

        <Section style={ctaWrapperStyle}>
          <Button href={siteUrl} style={buttonStyle}>
            Explore DeLi
          </Button>
        </Section>

        <Text style={footnoteStyle}>If you didn&apos;t request this, you can safely ignore this message.</Text>
      </Section>
    </EmailLayout>
  );
};

export default SubscribeWelcomeEmail;

const bannerHeroSectionStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  borderTopLeftRadius: "19px",
  borderTopRightRadius: "19px",
  overflow: "hidden",
};

const bannerHeroColumnStyle = (bannerSrc: string): CSSProperties => ({
  backgroundColor: colors.accentDark,
  backgroundImage: `url(${bannerSrc})`,
  backgroundSize: "cover",
  backgroundPosition: "center center",
  backgroundRepeat: "no-repeat",
  height: "178px",
  padding: "28px 32px",
  verticalAlign: "top",
});

const logoLinkStyle: CSSProperties = {
  textDecoration: "none",
};

const logoRowStyle: CSSProperties = {
  width: "auto",
};

const logoFontFamily = "Urbanist, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const logoWordColumnFirstStyle: CSSProperties = {
  width: "auto",
  verticalAlign: "middle",
  paddingRight: "8px",
};

const logoWordColumnLastStyle: CSSProperties = {
  width: "auto",
  verticalAlign: "middle",
  paddingLeft: "0",
};

const logoIconColumnStyle: CSSProperties = {
  width: "40px",
  verticalAlign: "middle",
  paddingRight: "8px",
};

const logoWordStyle: CSSProperties = {
  margin: 0,
  fontFamily: logoFontFamily,
  fontSize: "32px",
  fontWeight: 500,
  lineHeight: "1.2",
  letterSpacing: "-0.05em",
  color: colors.white,
  textShadow: "0 2px 16px rgba(7, 10, 13, 0.75)",
};

const logoIconStyle: CSSProperties = {
  display: "block",
  margin: 0,
};

const contentSectionStyle: CSSProperties = {
  padding: "32px 32px 40px",
};

const chipStyle: CSSProperties = {
  display: "inline-block",
  margin: "0 0 20px",
  padding: "6px 12px",
  fontSize: "11px",
  fontWeight: 400,
  lineHeight: "1.2",
  letterSpacing: "0.18em",
  color: colors.accent,
  border: `1px solid ${colors.chipBorder}`,
  borderRadius: "999px",
  textTransform: "uppercase",
};

const headingStyle: CSSProperties = {
  margin: "0 0 16px",
  fontSize: "32px",
  fontWeight: 300,
  lineHeight: "1.2",
  color: colors.white,
  letterSpacing: "-0.01em",
};

const leadStyle: CSSProperties = {
  margin: "0 0 14px",
  fontSize: "18px",
  lineHeight: "1.45",
  color: colors.white,
};

const bodyStyle: CSSProperties = {
  margin: "0 0 4px",
  fontSize: "16px",
  lineHeight: "1.5",
  color: colors.grey,
};

const emphasisStyle: CSSProperties = {
  color: colors.white,
  fontWeight: 400,
};

const dividerStyle: CSSProperties = {
  borderColor: colors.stroke,
  margin: "32px 0 24px",
};

const featuresLabelStyle: CSSProperties = {
  margin: "0 0 16px",
  fontSize: "12px",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: colors.grey,
};

const featureRowStyle: CSSProperties = {
  marginBottom: "6px",
};

const bulletColumnStyle: CSSProperties = {
  width: "20px",
  verticalAlign: "top",
  paddingTop: "9px",
};

const bulletDotStyle: CSSProperties = {
  width: "8px",
  height: "8px",
  backgroundColor: colors.accent,
};

const featureTextStyle: CSSProperties = {
  margin: "4px 0",
  fontSize: "15px",
  lineHeight: "1.4",
  color: colors.white,
};

const ctaWrapperStyle: CSSProperties = {
  marginTop: "32px",
};

const buttonStyle: CSSProperties = {
  display: "inline-block",
  padding: "12px 28px",
  fontSize: "16px",
  fontWeight: 400,
  lineHeight: "1.3",
  color: colors.accentDark,
  backgroundColor: colors.accent,
  borderRadius: "10px",
  textDecoration: "none",
};

const footnoteStyle: CSSProperties = {
  margin: "28px 0 0",
  fontSize: "12px",
  lineHeight: "1.4",
  color: colors.grey,
};

const wordmarkSectionStyle: CSSProperties = {
  textAlign: "center" as const,
  margin: "28px 0 0",
};

const wordmarkImgStyle: CSSProperties = {
  display: "inline-block",
  width: "280px",
  height: "auto",
  opacity: 0.85,
};
