function setupGift() {
  const toggle = document.getElementById("giftToggle");
  const content = document.getElementById("giftContent");
  if (toggle && content) {
    const label = toggle.querySelector("span");
    toggle.addEventListener("click", () => {
      const willOpen = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(willOpen));
      label.textContent = willOpen ? I18N.giftHide : I18N.giftOpen;
      const pieces = content.querySelectorAll(".gift__label, .tag");
      gsap.killTweensOf([content, ...pieces]);
      gsap.set(pieces, { clearProps: "transform,opacity" });
      if (!willOpen) {
        if (prefersReducedMotion) {
          content.hidden = true;
          ScrollTrigger.refresh();
          return;
        }
        gsap.to(content, { height: 0, opacity: 0, overflow: "hidden", duration: .6, ease: "power3.inOut", onComplete: () => { content.hidden = true; gsap.set(content, { clearProps: "all" }); ScrollTrigger.refresh(); } });
        return;
      }
      gsap.set(content, { clearProps: "all" });
      content.hidden = false;
      ScrollTrigger.refresh();
      if (prefersReducedMotion) return;
      gsap.from(pieces, { x: -40, opacity: 0, duration: 1.1, ease: "expo.out", stagger: .12, clearProps: "transform,opacity" });
      lenis.scrollTo(content, { offset: -140, duration: 1.4 });
    });
  }
  document.querySelectorAll("button[data-copy]").forEach((button) => {
    const label = button.querySelector("span") || button.lastChild;
    const originalLabel = label.textContent;
    const value = button.hasAttribute("data-copy-compact") ? button.dataset.copy.replace(/[\s.-]/g, "") : button.dataset.copy;
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(value);
        label.textContent = I18N.copied;
      } catch {
        label.textContent = I18N.copyFailed;
      }
      setTimeout(() => { label.textContent = originalLabel; }, 1800);
    });
  });
}
