"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox"; // Assuming standard Checkbox component exists or using mock
import { Label } from "@/components/ui/label";
import { MapPin, DollarSign, Clock, Layers } from "lucide-react";
import { useState } from "react";

export function FilterSidebar() {
    const [salary, setSalary] = useState([120]);

    return (
        <div className="w-64 shrink-0 space-y-6 hidden lg:block">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Filters</h3>
                <button className="text-xs text-zinc-500 hover:text-white">Clear All</button>
            </div>

            <Accordion type="multiple" defaultValue={["tech", "location", "comp"]} className="w-full">

                {/* Tech Stack */}
                <AccordionItem value="tech" className="border-white/5">
                    <AccordionTrigger className="text-sm hover:no-underline hover:text-cyan-400">
                        <span className="flex items-center gap-2"><Layers className="w-4 h-4" /> Tech Stack</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2">
                        {['React', 'Node.js', 'Typescript', 'Python', 'AWS', 'Next.js'].map((tech) => (
                            <div key={tech} className="flex items-center space-x-2">
                                <Checkbox id={tech} className="border-white/20 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500" />
                                <Label htmlFor={tech} className="text-sm text-zinc-400 font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">{tech}</Label>
                            </div>
                        ))}
                    </AccordionContent>
                </AccordionItem>

                {/* Location */}
                <AccordionItem value="location" className="border-white/5">
                    <AccordionTrigger className="text-sm hover:no-underline hover:text-cyan-400">
                        <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Location</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded-full border border-cyan-500 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                            </div>
                            <span className="text-sm text-white">Global (Remote)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded-full border border-zinc-600" />
                            <span className="text-sm text-zinc-400">United States</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded-full border border-zinc-600" />
                            <span className="text-sm text-zinc-400">Europe</span>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Availability */}
                <AccordionItem value="avail" className="border-white/5">
                    <AccordionTrigger className="text-sm hover:no-underline hover:text-cyan-400">
                        <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Availability</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2">
                        {['Immediately', '2 Weeks Notice', 'Passive / Casual'].map((opt) => (
                            <div key={opt} className="flex items-center space-x-2">
                                <Checkbox id={opt} className="border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" />
                                <Label htmlFor={opt} className="text-sm text-zinc-400 font-normal cursor-pointer">{opt}</Label>
                            </div>
                        ))}
                    </AccordionContent>
                </AccordionItem>

                {/* Compensation */}
                <AccordionItem value="comp" className="border-white/5">
                    <AccordionTrigger className="text-sm hover:no-underline hover:text-cyan-400">
                        <span className="flex items-center gap-2"><DollarSign className="w-4 h-4" /> Salary Range</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <Slider
                            defaultValue={[120]}
                            max={300}
                            min={50}
                            step={5}
                            value={salary}
                            onValueChange={setSalary}
                            className="py-1"
                        />
                        <div className="flex justify-between text-xs font-mono text-zinc-400">
                            <span>$50k</span>
                            <span className="text-cyan-400 font-bold">${salary}k+</span>
                        </div>
                    </AccordionContent>
                </AccordionItem>

            </Accordion>
        </div>
    );
}
