"use client";

import PartnerHero from "./PartnerHero";
import StrategicShift from "./StrategicShift";
import PartnerCategories from "./PartnerCategories";
import PartnerTiers from "./PartnerTiers";
import PartnerForm from "./PartnerForm";
import PartnerCTA from "./PartnerCTA";

export default function PartnerPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <PartnerHero />
      <StrategicShift />
      <PartnerCategories />
      <PartnerTiers />
      <PartnerForm />
      <PartnerCTA />
    </main>
  );
}
