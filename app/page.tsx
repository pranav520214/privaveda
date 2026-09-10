'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ChapterProgress } from '@/components/navigation/ChapterProgress';
import { TechnicalDrawer } from '@/components/scientific/TechnicalDrawer';

// Narrative Chapters
import { HeroSection } from '@/components/narrative/HeroSection';
import { PatientContextSection } from '@/components/narrative/PatientContextSection';
import { BiologicalJourneySection } from '@/components/narrative/BiologicalJourneySection';
import { MolecularSection } from '@/components/narrative/MolecularSection';
import { DataToModelSection } from '@/components/narrative/DataToModelSection';
import { PKModelSection } from '@/components/narrative/PKModelSection';
import { TrajectorySection } from '@/components/narrative/TrajectorySection';
import { BayesianSection } from '@/components/narrative/BayesianSection';
import { UncertaintySection } from '@/components/narrative/UncertaintySection';
import { EvidenceGateSection } from '@/components/narrative/EvidenceGateSection';
import { Workbench } from '@/components/simulation/Workbench';
import { ClinicianReviewSection } from '@/components/narrative/ClinicianReviewSection';
import { ArchitectureSection } from '@/components/narrative/ArchitectureSection';
import { ValidationSection } from '@/components/narrative/ValidationSection';
import { RiskEngineeringSection } from '@/components/narrative/RiskEngineeringSection';
import { TargetUsersSection } from '@/components/narrative/TargetUsersSection';
import { MetricsSdgSection } from '@/components/narrative/MetricsSdgSection';
import { DeploymentSection } from '@/components/narrative/DeploymentSection';
import { FuturePlatformSection } from '@/components/narrative/FuturePlatformSection';
import { TeamVisionSection } from '@/components/narrative/TeamVisionSection';

export default function Home() {
  const [isTechnicalDrawerOpen, setIsTechnicalDrawerOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#FAF8F5]">
      {/* Navigation Header */}
      <Header
        onOpenTechnicalDrawer={() => setIsTechnicalDrawerOpen(true)}
        onScrollToSection={scrollToSection}
      />

      {/* Floating Chapter Progress */}
      <ChapterProgress />

      {/* Main Scientific Narrative Chapters */}
      <main className="flex-1 w-full">
        {/* 01: Hero / Patient Digital Twin */}
        <HeroSection
          onExplore={() => scrollToSection('workbench')}
          onSeeHowItWorks={() => scrollToSection('patient-context')}
        />

        {/* 02: Why Patient Context Matters */}
        <PatientContextSection />

        {/* 03: Biological Drug Journey */}
        <BiologicalJourneySection />

        {/* 04: Biological Complexity & Molecular Translation */}
        <MolecularSection />

        {/* 05: Data -> Computational Model Space */}
        <DataToModelSection />

        {/* 06: Pharmacokinetic Simulation & Compartments */}
        <PKModelSection />

        {/* 07: Concentration Trajectory Timeline */}
        <TrajectorySection />

        {/* 08: Bayesian Update in Action */}
        <BayesianSection />

        {/* 09: Uncertainty: A First-Class Object */}
        <UncertaintySection />

        {/* 10: The Evidence Gate & Abstention */}
        <EvidenceGateSection />

        {/* 11: Interactive PRIVAVEDA Simulation Workbench */}
        <Workbench />

        {/* 12: Clinician Review & Decision Governance */}
        <ClinicianReviewSection />

        {/* 13: 3D System Architecture */}
        <ArchitectureSection />

        {/* 14: Scientific Validation Pathway */}
        <ValidationSection />

        {/* 15: Risk Engineering Matrix */}
        <RiskEngineeringSection />

        {/* 16: Target Users & Clinical Workflow */}
        <TargetUsersSection />

        {/* 17: Metrics & UN SDGs */}
        <MetricsSdgSection />

        {/* 18: Hospital Deployment & Local Governance */}
        <DeploymentSection />

        {/* 19: Future Modular Platform */}
        <FuturePlatformSection />

        {/* 20: Team & Vision */}
        <TeamVisionSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Deep-Dive Technical Equations Drawer */}
      <TechnicalDrawer
        isOpen={isTechnicalDrawerOpen}
        onClose={() => setIsTechnicalDrawerOpen(false)}
      />
    </div>
  );
}
