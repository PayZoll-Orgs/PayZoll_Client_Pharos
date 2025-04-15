import { heroui } from "@heroui/theme";

export function customHeroui() {
    return (tailwindConfig) => {
        const heroPlugin = heroui();

        return (api) => {
            const originalAddUtilities = api.addUtilities;

            api.addUtilities = (utilities, options) => {
                const rootStuff = {};
                const normalStuff = {};

                Object.entries(utilities).forEach(([key, value]) => {
                    if (key === ':root' || key.startsWith(':root')) {
                        rootStuff[key] = value;
                    } else {
                        normalStuff[key] = value;
                    }
                });

                if (Object.keys(rootStuff).length > 0) {
                    api.addBase(rootStuff); // Use addBase instead for :root
                }

                if (Object.keys(normalStuff).length > 0) {
                    originalAddUtilities(normalStuff, options);
                }
            };

            return heroPlugin(api);
        };
    };
}