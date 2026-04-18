import { Navbar } from "@/components/marketing/navbar"
import { HeroSection } from "@/components/marketing/hero-section"
import { FeaturesSection } from "@/components/marketing/features-section"
import { AiSection } from "@/components/marketing/ai-section"
import { PricingSection } from "@/components/marketing/pricing-section"
import { CtaSection } from "@/components/marketing/cta-section"
import { Footer } from "@/components/marketing/footer"

export default function Home() {
  return (
    <div className="bg-[#0a0a0f] text-[#e2e8f0] overflow-x-hidden">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <AiSection />
        <PricingSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  )
}
