import Link from "next/link";
import { ArrowUpRight, Check, Shield, Wifi, Users } from "lucide-react";

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-background">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-background to-indigo-50 dark:from-blue-950/20 dark:via-background dark:to-indigo-950/20 opacity-70" />

      <div className="relative pt-16 pb-20 sm:pt-24 sm:pb-32 lg:pt-32 lg:pb-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 sm:mb-8 tracking-tight leading-tight">
              Smoke Detector{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                Maintenance
              </span>{" "}
              Made Simple
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-4">
              Coordinate maintenance across multiple apartment buildings with
              our offline-first Progressive Web App. Prevent duplicate visits
              and track service history in real-time.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center px-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-base sm:text-lg font-medium min-h-[48px] touch-manipulation"
              >
                Start Maintenance Tracking
                <ArrowUpRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Link>

              <Link
                href="#features"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-colors text-base sm:text-lg font-medium min-h-[48px] touch-manipulation"
              >
                Learn More
              </Link>
            </div>

            <div className="mt-12 sm:mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-8 text-xs sm:text-sm text-muted-foreground px-4">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                <span>Works offline inside buildings</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                <span>Real-time team coordination</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                <span>Secure data synchronization</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}