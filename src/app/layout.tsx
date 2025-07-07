import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobBoard Pro - Find Your Next Career Opportunity",
  description:
    "Discover and post job opportunities with JobBoard Pro. Connect employers with talented professionals in a modern, user-friendly platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // <Head>
  //       <script
  //         dangerouslySetInnerHTML={{
  //           __html: `
  //             window.embedded_svc = window.embedded_svc || {};
  //             window.embedded_svc.config = {
  //               "OrganizationId": "00DgK000005gscD",
  //               "DeveloperName": "Test_Pre_Screening_Agent",
  //               "Url": "https://orgfarm-bfd12e0ae2-dev-ed.develop.my.salesforce-scrt.com"
  //             };
  //           `,
  //         }}
  //       />
  //       {/* <script
  //         src="https://https://orgfarm-bfd12e0ae2-dev-ed.develop.my.salesforce.com/embeddedservice/yourdeployment.js"
  //         async
  //       ></script> */}
  //     </Head>
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
