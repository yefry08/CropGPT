import AirlockHero from "@/components/ui/airlock-spaceship-hero"

export default function DemoOne() {
    // w-full matters: preview hosts drop the demo into a centred flex container,
    // where a width-less flex item shrinks to its content instead of filling
    // the screen.
    return (
        <main className="w-full min-h-screen bg-[#05070d] text-[#f2f4f8]">
            <AirlockHero
                title="THE AIRLOCK OPENS"
                tagline="Everything you know fits in one half of the frame."
            />

            {/* Page content, so the hand-back at the end of the scrub is visible. */}
            <section className="mx-auto max-w-2xl px-6 py-32">
                <h2 className="text-3xl font-bold tracking-tight">The page starts here</h2>
                <p className="mt-4 text-base leading-relaxed opacity-70">
                    Scroll up into the hero and it takes the wheel again, at the last frame,
                    so the whole sequence plays backwards.
                </p>
            </section>
        </main>
    )
}
