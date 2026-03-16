import { motion } from "framer-motion";

const steps = [
  {
    num: "01",
    title: "Importuj & plň databázu",
    desc: "Nahrajte jedlá, suroviny a recepty — ručne alebo importom.",
  },
  {
    num: "02",
    title: "Generujte menu",
    desc: "AI alebo manuálne zostavte denné menu s pravidlami a kategóriami.",
  },
  {
    num: "03",
    title: "Exportujte & publikujte",
    desc: "TV obrazovky, PDF, Excel pre kuchyňu, web embed — všetky formáty.",
  },
  {
    num: "04",
    title: "AI Recept book & Sklad",
    desc: "Recepty, nákupné zoznamy a cenová inteligencia — automaticky.",
  },
];

const containerStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export function LandingHowItWorks() {
  return (
    <section className="border-y border-border/50 bg-card/30 px-4 py-24">
      <div className="mx-auto max-w-4xl">
        <motion.h2
          className="mb-14 text-center font-serif text-3xl font-bold sm:text-5xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          Ako to funguje
        </motion.h2>
        <motion.div
          className="grid gap-10 sm:grid-cols-2"
          variants={containerStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {steps.map((s) => (
            <motion.div key={s.num} variants={fadeUp} className="flex gap-5">
              <span className="font-serif text-5xl font-bold text-primary/25">{s.num}</span>
              <div>
                <h3 className="font-serif text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
