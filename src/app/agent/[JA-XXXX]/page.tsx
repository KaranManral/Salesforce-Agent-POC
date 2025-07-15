import ChatBot from "@/app/components/Agent";

function validateJobApplicationNumber(jobApplicationNumber: string): boolean {
  const jaParts = jobApplicationNumber.split("-");
  if (jaParts.length !== 2) {
    return false;
  }
  const jaPrefix = jaParts[0].toUpperCase();
  if(jaPrefix !== "JA") {
    return false;
  }
  if(!/^\d{5}$/.test(jaParts[1])) {
    return false;
  }
  return true;
}

export default async function Agent({params}: {params: {"JA-XXXX": string}}) {
  const query = await params;
  const jobApplicationNumber = query["JA-XXXX"];
  if (!validateJobApplicationNumber(jobApplicationNumber)) {
    return <>400: Invalid Request</>
  }
  return <ChatBot jobApplicationNumber={jobApplicationNumber} />;
}
