import React from "react";

export const QodeeLogo = ({ className }: { className?: string }) => {
    return (
        /* raw img: caller-controlled className means render size is unknown — explicit next/image width/height could distort, so left as raw */
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src="/logo.png"
            alt="SkilledCore Logo"
            className={className}
        />
    );
};
