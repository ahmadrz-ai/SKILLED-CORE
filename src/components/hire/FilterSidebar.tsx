"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox"; // Assuming standard Checkbox component exists or using mock
import { Label } from "@/components/ui/label";
import { MapPin, DollarSign, Clock, Layers } from "lucide-react";
import { useState } from "react";

export interface FilterSidebarProps {
    activeTechFilters?: string[];
    onTechFilterChange?: (filters: string[]) => void;
    onClearAll?: () => void;
}

export function FilterSidebar({ activeTechFilters = [], onTechFilterChange, onClearAll }: FilterSidebarProps) {
    const [salary, setSalary] = useState([120]);

    const handleTechToggle = (tech: string) => {
        if (!onTechFilterChange) return;
        if (activeTechFilters.includes(tech)) {
            onTechFilterChange(activeTechFilters.filter(t => t !== tech));
        } else {
            onTechFilterChange([...activeTechFilters, tech]);
        }
    };

    return (
        <div className="w-64 shrink-0 space-y-6 hidden lg:block bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm h-fit">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">Filters</h3>
                <button onClick={onClearAll} className="text-xs text-[#6B7280] hover:text-[#7C3AED] transition-colors">Clear All</button>
            </div>

            <Accordion type="multiple" defaultValue={["tech", "location", "comp"]} className="w-full">

                {/* Tech Stack */}
                <AccordionItem value="tech" className="border-[#E5E7EB]">
                    <AccordionTrigger className="text-sm hover:no-underline hover:text-[#7C3AED] text-[#4B5563]">
                        <span className="flex items-center gap-2"><Layers className="w-4 h-4" /> Tech Stack</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2">
                        {['React', 'Node.js', 'Typescript', 'Python', 'AWS', 'Next.js'].map((tech) => (
                            <div key={tech} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={tech} 
                                    checked={activeTechFilters.includes(tech)}
                                    onCheckedChange={() => handleTechToggle(tech)}
                                    className="border-[#D1D5DB] data-[state=checked]:bg-[#7C3AED] data-[state=checked]:border-[#7C3AED]" 
                                />
                                <Label htmlFor={tech} className="text-sm text-[#6B7280] font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">{tech}</Label>
                            </div>
                        ))}
                    </AccordionContent>
                </AccordionItem>

                {/* Location */}
                <AccordionItem value="location" className="border-[#E5E7EB]">
                    <AccordionTrigger className="text-sm hover:no-underline hover:text-[#7C3AED] text-[#4B5563]">
                        <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Location</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded-full border border-[#7C3AED] flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                            </div>
                            <span className="text-sm text-[#111827]">Global (Remote)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded-full border border-[#D1D5DB]" />
                            <span className="text-sm text-[#6B7280]">United States</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded-full border border-[#D1D5DB]" />
                            <span className="text-sm text-[#6B7280]">Europe</span>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Availability */}
                <AccordionItem value="avail" className="border-[#E5E7EB]">
                    <AccordionTrigger className="text-sm hover:no-underline hover:text-[#7C3AED] text-[#4B5563]">
                        <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Availability</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2">
                        {['Immediately', '2 Weeks Notice', 'Passive / Casual'].map((opt) => (
                            <div key={opt} className="flex items-center space-x-2">
                                <Checkbox id={opt} className="border-[#D1D5DB] data-[state=checked]:bg-[#10B981] data-[state=checked]:border-[#10B981]" />
                                <Label htmlFor={opt} className="text-sm text-[#6B7280] font-normal cursor-pointer">{opt}</Label>
                            </div>
                        ))}
                    </AccordionContent>
                </AccordionItem>

                {/* Compensation */}
                <AccordionItem value="comp" className="border-[#E5E7EB]">
                    <AccordionTrigger className="text-sm hover:no-underline hover:text-[#7C3AED] text-[#4B5563]">
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
                        <div className="flex justify-between text-xs font-mono text-[#6B7280]">
                            <span>$50k</span>
                            <span className="text-[#7C3AED] font-bold">${salary}k+</span>
                        </div>
                    </AccordionContent>
                </AccordionItem>

            </Accordion>
        </div>
    );
}
