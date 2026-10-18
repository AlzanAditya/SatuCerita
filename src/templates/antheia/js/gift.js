function setupGift() {
  const toggle = document.getElementById("giftToggle");
  const content = document.getElementById("giftContent");
  if (toggle && content) {
    const toggleLabel = toggle.querySelector("span");
    toggle.addEventListener("click", () => {
      const willOpen = content.hidden;
      toggle.setAttribute("aria-expanded", String(willOpen));
      toggleLabel.textContent = willOpen ? I18N.giftHide : I18N.giftOpen;
      const cards = content.querySelectorAll(".bank, .parcel");
      const headings = content.querySelectorAll(".gift__heading");
      gsap.killTweensOf([content, ...cards, ...headings]);
      if (!willOpen) {
        gsap.to(content, { height: 0, opacity: 0, overflow: "hidden", duration: .6, ease: "power3.inOut", onComplete: () => { content.hidden = true; gsap.set(content, { clearProps: "all" }); ScrollTrigger.refresh(); } });
        return;
      }
      content.hidden = false;
      const tag = document.querySelector("[data-gift-tag]");
      if (tag && !prefersReducedMotion) gsap.fromTo(tag, { rotationY: 0 }, { rotationY: 360, transformPerspective: 600, duration: 1.3, ease: "power2.inOut" });
      ScrollTrigger.refresh();
      if (prefersReducedMotion) return;
      gsap.timeline()
        .from(headings, { opacity: 0, y: 14, duration: .8, stagger: .3, ease: "power3.out", clearProps: "transform,opacity" }, 0)
        .from(cards, { y: -80, scale: .85, rotation: (index) => (index % 2 ? 4 : -4), opacity: 0, duration: 1.05, ease: "back.out(1.3)", stagger: .16, clearProps: "transform,opacity" }, .1);
      lenis.scrollTo(content, { offset: -120, duration: 1.4 });
    });
  }
  document.querySelectorAll("[data-copy]").forEach((button) => {
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
