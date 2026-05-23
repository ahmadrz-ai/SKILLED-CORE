export interface CollageLayout {
    id: string;
    name: string;
    imgCount: number;
    gridClass: string;
    itemClasses: string[];
}

export const COLLAGE_LAYOUTS: CollageLayout[] = [
    // ==========================================
    // 2 IMAGES (15 Layouts)
    // ==========================================
    {
        id: "2-default",
        name: "Vertical Split (50/50)",
        imgCount: 2,
        gridClass: "grid grid-cols-2 gap-1.5 aspect-[3/2]",
        itemClasses: ["col-span-1", "col-span-1"]
    },
    {
        id: "2-split-horiz",
        name: "Horizontal Split (50/50)",
        imgCount: 2,
        gridClass: "grid grid-rows-2 gap-1.5 aspect-[4/5] max-h-[500px]",
        itemClasses: ["row-span-1", "row-span-1"]
    },
    {
        id: "2-left-tall-60",
        name: "Left Dominant (60/40)",
        imgCount: 2,
        gridClass: "grid grid-cols-5 gap-1.5 aspect-[3/2]",
        itemClasses: ["col-span-3", "col-span-2"]
    },
    {
        id: "2-right-tall-60",
        name: "Right Dominant (40/60)",
        imgCount: 2,
        gridClass: "grid grid-cols-5 gap-1.5 aspect-[3/2]",
        itemClasses: ["col-span-2", "col-span-3"]
    },
    {
        id: "2-top-flat-60",
        name: "Top Dominant (60/40)",
        imgCount: 2,
        gridClass: "grid grid-rows-5 gap-1.5 aspect-[4/3]",
        itemClasses: ["row-span-3", "row-span-2"]
    },
    {
        id: "2-bottom-flat-60",
        name: "Bottom Dominant (40/60)",
        imgCount: 2,
        gridClass: "grid grid-rows-5 gap-1.5 aspect-[4/3]",
        itemClasses: ["row-span-2", "row-span-3"]
    },
    {
        id: "2-left-tall-70",
        name: "Left Focus (70/30)",
        imgCount: 2,
        gridClass: "grid grid-cols-10 gap-1.5 aspect-[16/10]",
        itemClasses: ["col-span-7", "col-span-3"]
    },
    {
        id: "2-right-tall-70",
        name: "Right Focus (30/70)",
        imgCount: 2,
        gridClass: "grid grid-cols-10 gap-1.5 aspect-[16/10]",
        itemClasses: ["col-span-3", "col-span-7"]
    },
    {
        id: "2-top-flat-70",
        name: "Top Focus (70/30)",
        imgCount: 2,
        gridClass: "grid grid-rows-10 gap-1.5 aspect-[4/3]",
        itemClasses: ["row-span-7", "row-span-3"]
    },
    {
        id: "2-bottom-flat-70",
        name: "Bottom Focus (30/70)",
        imgCount: 2,
        gridClass: "grid grid-rows-10 gap-1.5 aspect-[4/3]",
        itemClasses: ["row-span-3", "row-span-7"]
    },
    {
        id: "2-asymmetric-1",
        name: "Asymmetric Left (2/3 Split)",
        imgCount: 2,
        gridClass: "grid grid-cols-3 gap-1.5 aspect-[16/10]",
        itemClasses: ["col-span-2", "col-span-1"]
    },
    {
        id: "2-asymmetric-2",
        name: "Asymmetric Right (1/3 Split)",
        imgCount: 2,
        gridClass: "grid grid-cols-3 gap-1.5 aspect-[16/10]",
        itemClasses: ["col-span-1", "col-span-2"]
    },
    {
        id: "2-asymmetric-3",
        name: "Asymmetric Top (2/3 Split)",
        imgCount: 2,
        gridClass: "grid grid-rows-3 gap-1.5 aspect-[4/3]",
        itemClasses: ["row-span-2", "row-span-1"]
    },
    {
        id: "2-asymmetric-4",
        name: "Asymmetric Bottom (1/3 Split)",
        imgCount: 2,
        gridClass: "grid grid-rows-3 gap-1.5 aspect-[4/3]",
        itemClasses: ["row-span-1", "row-span-2"]
    },
    {
        id: "2-gapless",
        name: "Gapless Vertical Split",
        imgCount: 2,
        gridClass: "grid grid-cols-2 gap-0 aspect-[3/2]",
        itemClasses: ["col-span-1", "col-span-1"]
    },

    // ==========================================
    // 3 IMAGES (18 Layouts)
    // ==========================================
    {
        id: "3-default",
        name: "Left Tall dominant",
        imgCount: 3,
        gridClass: "grid grid-cols-3 gap-1.5 aspect-[16/10]",
        itemClasses: ["col-span-2 row-span-2", "col-span-1 row-span-1", "col-span-1 row-span-1"]
    },
    {
        id: "3-right-tall",
        name: "Right Tall dominant",
        imgCount: 3,
        gridClass: "grid grid-cols-3 gap-1.5 aspect-[16/10]",
        itemClasses: ["col-span-1 row-span-1", "col-span-1 row-span-1", "col-span-2 row-span-2"]
    },
    {
        id: "3-top-wide",
        name: "Top Wide dominant",
        imgCount: 3,
        gridClass: "grid grid-rows-2 grid-cols-2 gap-1.5 aspect-[4/3]",
        itemClasses: ["col-span-2 row-span-1", "col-span-1 row-span-1", "col-span-1 row-span-1"]
    },
    {
        id: "3-bottom-wide",
        name: "Bottom Wide dominant",
        imgCount: 3,
        gridClass: "grid grid-rows-2 grid-cols-2 gap-1.5 aspect-[4/3]",
        itemClasses: ["col-span-1 row-span-1", "col-span-1 row-span-1", "col-span-2 row-span-1"]
    },
    {
        id: "3-columns",
        name: "Three Equal Columns",
        imgCount: 3,
        gridClass: "grid grid-cols-3 gap-1.5 aspect-[16/10]",
        itemClasses: ["col-span-1", "col-span-1", "col-span-1"]
    },
    {
        id: "3-rows",
        name: "Three Equal Rows",
        imgCount: 3,
        gridClass: "grid grid-rows-3 gap-1.5 aspect-[3/4] max-h-[500px]",
        itemClasses: ["row-span-1", "row-span-1", "row-span-1"]
    },
    {
        id: "3-left-strip",
        name: "Left Thin dominant",
        imgCount: 3,
        gridClass: "grid grid-cols-4 gap-1.5 aspect-[16/10]",
        itemClasses: ["col-span-2", "col-span-1", "col-span-1"]
    },
    {
        id: "3-right-strip",
        name: "Right Thin dominant",
        imgCount: 3,
        gridClass: "grid grid-cols-4 gap-1.5 aspect-[16/10]",
        itemClasses: ["col-span-1", "col-span-1", "col-span-2"]
    },
    {
        id: "3-asymmetric-1",
        name: "Asymmetric Split Left (2-1-1)",
        imgCount: 3,
        gridClass: "grid grid-cols-4 gap-1.5 aspect-[16/10]",
        itemClasses: ["col-span-2", "col-span-1", "col-span-1"]
    },
    {
        id: "3-asymmetric-2",
        name: "Asymmetric Split Middle (1-2-1)",
        imgCount: 3,
        gridClass: "grid grid-cols-4 gap-1.5 aspect-[16/10]",
        itemClasses: ["col-span-1", "col-span-2", "col-span-1"]
    },
    {
        id: "3-asymmetric-3",
        name: "Asymmetric Split Right (1-1-2)",
        imgCount: 3,
        gridClass: "grid grid-cols-4 gap-1.5 aspect-[16/10]",
        itemClasses: ["col-span-1", "col-span-1", "col-span-2"]
    },
    {
        id: "3-asymmetric-4",
        name: "Asymmetric Split Top (2-1-1 Rows)",
        imgCount: 3,
        gridClass: "grid grid-rows-4 gap-1.5 aspect-[4/3]",
        itemClasses: ["row-span-2", "row-span-1", "row-span-1"]
    },
    {
        id: "3-asymmetric-5",
        name: "Asymmetric Split Mid (1-2-1 Rows)",
        imgCount: 3,
        gridClass: "grid grid-rows-4 gap-1.5 aspect-[4/3]",
        itemClasses: ["row-span-1", "row-span-2", "row-span-1"]
    },
    {
        id: "3-asymmetric-6",
        name: "Asymmetric Split Bottom (1-1-2 Rows)",
        imgCount: 3,
        gridClass: "grid grid-rows-4 gap-1.5 aspect-[4/3]",
        itemClasses: ["row-span-1", "row-span-1", "row-span-2"]
    },
    {
        id: "3-middle-tall",
        name: "Center Focused Tall",
        imgCount: 3,
        gridClass: "grid grid-cols-4 gap-1.5 aspect-[16/10]",
        itemClasses: ["col-span-1", "col-span-2", "col-span-1"]
    },
    {
        id: "3-middle-wide",
        name: "Center Focused Wide",
        imgCount: 3,
        gridClass: "grid grid-rows-4 gap-1.5 aspect-[4/3]",
        itemClasses: ["row-span-1", "row-span-2", "row-span-1"]
    },
    {
        id: "3-stair-up",
        name: "Staircase Up",
        imgCount: 3,
        gridClass: "grid grid-cols-3 grid-rows-3 gap-1.5 aspect-[4/3]",
        itemClasses: ["col-span-1 row-span-1 row-start-3", "col-span-1 row-span-1 row-start-2", "col-span-1 row-span-1 row-start-1"]
    },
    {
        id: "3-stair-down",
        name: "Staircase Down",
        imgCount: 3,
        gridClass: "grid grid-cols-3 grid-rows-3 gap-1.5 aspect-[4/3]",
        itemClasses: ["col-span-1 row-span-1 row-start-1", "col-span-1 row-span-1 row-start-2", "col-span-1 row-span-1 row-start-3"]
    },

    // ==========================================
    // 4 IMAGES (20 Layouts)
    // ==========================================
    {
        id: "4-default",
        name: "Grid Quadrants (2x2)",
        imgCount: 4,
        gridClass: "grid grid-cols-2 grid-rows-2 gap-1.5 aspect-[4/3]",
        itemClasses: ["col-span-1 row-span-1", "col-span-1 row-span-1", "col-span-1 row-span-1", "col-span-1 row-span-1"]
    },
    {
        id: "4-left-tall",
        name: "Left Tall Dominant (1+3)",
        imgCount: 4,
        gridClass: "grid grid-cols-3 gap-1.5 aspect-[16/11]",
        itemClasses: ["col-span-2 row-span-3", "col-span-1 row-span-1", "col-span-1 row-span-1", "col-span-1 row-span-1"]
    },
    {
        id: "4-right-tall",
        name: "Right Tall Dominant (3+1)",
        imgCount: 4,
        gridClass: "grid grid-cols-3 gap-1.5 aspect-[16/11]",
        itemClasses: ["col-span-1 row-span-1", "col-span-1 row-span-1", "col-span-1 row-span-1", "col-span-2 row-span-3"]
    },
    {
        id: "4-top-wide",
        name: "Top Wide Dominant (1+3)",
        imgCount: 4,
        gridClass: "grid grid-rows-3 grid-cols-3 gap-1.5 aspect-[4/3]",
        itemClasses: ["col-span-3 row-span-2", "col-span-1 row-span-1", "col-span-1 row-span-1", "col-span-1 row-span-1"]
    },
    {
        id: "4-bottom-wide",
        name: "Bottom Wide Dominant (3+1)",
        imgCount: 4,
        gridClass: "grid grid-rows-3 grid-cols-3 gap-1.5 aspect-[4/3]",
        itemClasses: ["col-span-1 row-span-1", "col-span-1 row-span-1", "col-span-1 row-span-1", "col-span-3 row-span-2"]
    },
    {
        id: "4-columns",
        name: "Four Vertical Columns",
        imgCount: 4,
        gridClass: "grid grid-cols-4 gap-1.5 aspect-[16/10]",
        itemClasses: ["col-span-1", "col-span-1", "col-span-1", "col-span-1"]
    },
    {
        id: "4-rows",
        name: "Four Horizontal Rows",
        imgCount: 4,
        gridClass: "grid grid-rows-4 gap-1.5 aspect-[3/4] max-h-[550px]",
        itemClasses: ["row-span-1", "row-span-1", "row-span-1", "row-span-1"]
    },
    {
        id: "4-t-layout",
        name: "T-Layout Grid",
        imgCount: 4,
        gridClass: "grid grid-cols-3 grid-rows-2 gap-1.5 aspect-[4/3]",
        itemClasses: ["col-span-3 row-span-1", "col-span-1 row-span-1", "col-span-1 row-span-1", "col-span-1 row-span-1"]
    },
    {
        id: "4-inverted-t",
        name: "Inverted T-Layout",
        imgCount: 4,
        gridClass: "grid grid-cols-3 grid-rows-2 gap-1.5 aspect-[4/3]",
        itemClasses: ["col-span-1 row-span-1", "col-span-1 row-span-1", "col-span-1 row-span-1", "col-span-3 row-span-1"]
    },
    {
        id: "4-vertical-stripes",
        name: "Asymmetric Stripes Vertical",
        imgCount: 4,
        gridClass: "grid grid-cols-5 gap-1.5 aspect-[16/10]",
        itemClasses: ["col-span-2", "col-span-1", "col-span-1", "col-span-1"]
    },
    {
        id: "4-checkerboard-1",
        name: "Checkerboard Layout A",
        imgCount: 4,
        gridClass: "grid grid-cols-4 grid-rows-2 gap-1.5 aspect-[16/10]",
        itemClasses: ["col-span-2 row-span-2", "col-span-1 row-span-1", "col-span-1 row-span-1", "col-span-2 row-span-1"]
    },
    {
        id: "4-checkerboard-2",
        name: "Checkerboard Layout B",
        imgCount: 4,
        gridClass: "grid grid-cols-4 grid-rows-2 gap-1.5 aspect-[16/10]",
        itemClasses: ["col-span-2 row-span-1", "col-span-1 row-span-1", "col-span-1 row-span-1", "col-span-2 row-span-2"]
    },
    {
        id: "4-split-vertical-2x2",
        name: "Split Side-by-Side Dual Columns",
        imgCount: 4,
        gridClass: "grid grid-cols-4 gap-1.5 aspect-[16/10]",
        itemClasses: ["col-span-2 row-span-1", "col-span-2 row-span-1", "col-span-2 row-span-1", "col-span-2 row-span-1"]
    },
    {
        id: "4-split-horizontal-2x2",
        name: "Split Stacking Dual Rows",
        imgCount: 4,
        gridClass: "grid grid-rows-4 gap-1.5 aspect-[4/3]",
        itemClasses: ["row-span-2 col-span-1", "row-span-2 col-span-1", "row-span-2 col-span-1", "row-span-2 col-span-1"]
    },
    {
        id: "4-asymmetric-left",
        name: "Asymmetric Split Left (2-1-1-1)",
        imgCount: 4,
        gridClass: "grid grid-cols-5 gap-1.5 aspect-[16/10]",
        itemClasses: ["col-span-2", "col-span-1", "col-span-1", "col-span-1"]
    },
    {
        id: "4-asymmetric-right",
        name: "Asymmetric Split Right (1-1-1-2)",
        imgCount: 4,
        gridClass: "grid grid-cols-5 gap-1.5 aspect-[16/10]",
        itemClasses: ["col-span-1", "col-span-1", "col-span-1", "col-span-2"]
    },
    {
        id: "4-asymmetric-middle",
        name: "Asymmetric Split Mid (1-2-1-1)",
        imgCount: 4,
        gridClass: "grid grid-cols-5 gap-1.5 aspect-[16/10]",
        itemClasses: ["col-span-1", "col-span-2", "col-span-1", "col-span-1"]
    },
    {
        id: "4-diagonal-stair",
        name: "Diagonal Stair step",
        imgCount: 4,
        gridClass: "grid grid-cols-4 grid-rows-4 gap-1.5 aspect-[4/3]",
        itemClasses: ["row-start-1 col-start-1", "row-start-2 col-start-2", "row-start-3 col-start-3", "row-start-4 col-start-4"]
    },
    {
        id: "4-stair-up",
        name: "Staircase Up (4)",
        imgCount: 4,
        gridClass: "grid grid-cols-4 grid-rows-4 gap-1.5 aspect-[4/3]",
        itemClasses: [
            "row-start-4 col-start-1",
            "row-start-3 col-start-2",
            "row-start-2 col-start-3",
            "row-start-1 col-start-4"
        ]
    },
    {
        id: "4-stair-down",
        name: "Staircase Down (4)",
        imgCount: 4,
        gridClass: "grid grid-cols-4 grid-rows-4 gap-1.5 aspect-[4/3]",
        itemClasses: [
            "row-start-1 col-start-1",
            "row-start-2 col-start-2",
            "row-start-3 col-start-3",
            "row-start-4 col-start-4"
        ]
    }
];

export const getLayoutById = (id: string, fallbackCount: number): CollageLayout => {
    const layout = COLLAGE_LAYOUTS.find(l => l.id === id);
    if (layout) return layout;
    
    // Return standard fallback layouts if ID is not found or is "default"
    const fallbackId = `${fallbackCount}-default`;
    return COLLAGE_LAYOUTS.find(l => l.id === fallbackId) || COLLAGE_LAYOUTS[0];
};
