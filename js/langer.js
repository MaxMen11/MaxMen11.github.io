document.body.style.display = "none"; // Hide body to prevent flickering
document.addEventListener("DOMContentLoaded", function () {
    setTimeout(async () => {
        const metaTag = document.querySelector('meta[name="langer-conf"]');
        if (!metaTag) return;
        // Extract available languages
        const o = [...metaTag.attributes]
            .filter(attr => /-src$/.test(attr.name))
            .map(attr => attr.name.split("-")[0]);
        // Determine the language
        const urlLang = new URLSearchParams(location.search).get("lang");
        const browserLang = (navigator.language || "en").split("-")[0];
        const defaultLang = metaTag.getAttribute("defaultLang");
        const selectedLang = o.includes(urlLang)
            ? urlLang
            : o.includes(browserLang)
            ? browserLang
            : o.includes(defaultLang)
            ? defaultLang
            : o[0] || "en";
        // Create a new meta tag for the selected language
        const langMeta = document.createElement("meta");
        const langSrc = metaTag.getAttribute(`${selectedLang}-src`);
        langMeta.name = "langer-set";
        langMeta.setAttribute("lang", selectedLang);
        langMeta.setAttribute("lang-src", langSrc);
        document.head.appendChild(langMeta);
        try {
            // Fetch translation file
            const response = await fetch(langSrc + "?_1=" + Date.now() + "&_2=" + Math.random());
            if (!response.ok) throw new Error(`No translation src file found.`);
            const translations = await response.json();
            // Clone the entire document to work on it in memory
            const docClone = document.cloneNode(true);
            // Apply translations
            docClone.body.innerHTML = docClone.body.innerHTML.replace(
                /{={=(\w*):langer}}/g,
                (match, key) => translations[key] || (console.warn(`No translation found for key: ${key}`), match)
            );
            docClone.head.innerHTML = docClone.head.innerHTML.replace(
                /{={=(\w*):langer}}/g,
                (match, key) => translations[key] || (console.warn(`No translation found for key: ${key}`), match)
            );
            // Populate the language selection dropdown
            const langSelectId = metaTag.getAttribute("langSelectorId");
            const langSelect = docClone.getElementById(langSelectId);
            if (langSelect) {
                const fragment = document.createDocumentFragment();
                o.forEach(lang => {
                    const option = document.createElement("option");
                    option.value = lang;
                    option.textContent = lang.toUpperCase();
                    if (lang === selectedLang) option.selected = true;
                    fragment.appendChild(option);
                });
                langSelect.appendChild(fragment);
                langSelect.onchange = function () {
                    window.location.search = `lang=${this.value}`;
                };
            }
            // Update anchor tags to include the lang parameter
            docClone.body.querySelectorAll('a').forEach(anchor => {
                const href = new URL(anchor.href);
                href.searchParams.set("lang", selectedLang); // Set lang parameter
                anchor.href = href.toString(); // Update the href
            });
            // Ensure body is visible before replacing it
            docClone.body.style.display = "";
            // Replace the body and head
            document.body.replaceWith(docClone.body);
            document.head.replaceWith(docClone.head);

        } catch (error) {
            console.error("Error loading translation:", error);
            document.body.style.display = ""; // Ensure body is visible even if there's an error
        }
    }, 100);
});
