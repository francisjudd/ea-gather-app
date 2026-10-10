import { notFound } from 'next/navigation'
import ContactMpFlow from '../ContactMpFlow'
import { flowSteps } from '../steps'

export default async function ContactMpStepPage({
  params,
}: {
  params: Promise<{ step: string }>
}) {
  const { step } = await params

  if (!flowSteps.some((flowStep) => flowStep.slug === step)) {
    notFound()
  }

  return <ContactMpFlow step={step} />
}
