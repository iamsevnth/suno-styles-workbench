import { ContentPage, ExternalLink, Prose, Section } from "../components/content/Content.tsx";
import { headlineCase } from "../lib/text/headline-case.ts";

const CONTACT_EMAIL = "mateus@sevnthlabs.com";

export default function PrivacyPolicyPage() {
  return (
    <ContentPage>
      <header className="flex flex-col gap-4">
        <p className="label-caps eyebrow">SEVNTHLABS</p>
        <h1 className="text-4xl font-bold tracking-tight text-[var(--fg)]">{headlineCase("Privacy Policy")}</h1>
        <p className="text-base text-[var(--fg-muted)] leading-relaxed w-full">
          Suno Workbench is designed so that your creative work stays on your device. The application runs entirely
          client-side in your browser and does not send your prompts, lyrics, Styles text or generated content to
          SEVNTHLABS.
        </p>
        <p className="text-xs text-[var(--fg-subtle)]">Last updated: October 25, 2026</p>
      </header>

      <Section id="privacy-introduction" title="Introduction">
        <Prose>
          <p>
            This Privacy Policy explains how SEVNTHLABS ("SEVNTHLABS", "we", "us" or "our") handles information in
            connection with Suno Workbench at sunoworkbench.com (the "Site"). It applies to the Site and the
            browser-based tools made available through it.
          </p>
          <p>
            Suno Workbench has no application backend, no user accounts and no server-side prompt processing. The
            hosted Site and the downloadable offline file use the same client-side application architecture.
          </p>
        </Prose>
      </Section>

      <Section id="privacy-information" title="Information We Do and Do Not Collect">
        <Prose>
          <p>
            SEVNTHLABS does not collect, receive, store or transmit the prompts, creative briefs, lyrics, Styles
            prompts, generated outputs or history that you enter or create in Suno Workbench. All compilation and lyric
            processing happens locally in your browser.
          </p>
          <p>
            The application may save working state in your browser's <code>sessionStorage</code> and Styles history,
            preferences and theme choices in <code>localStorage</code>. Those records remain on your device and are not
            transmitted to SEVNTHLABS. You can clear them through the application controls or your browser settings.
          </p>
          <p>
            If you contact SEVNTHLABS by email, we receive the information you choose to include in that message so we
            can respond. Do not include confidential prompts or other sensitive information unless it is necessary for
            your support request.
          </p>
        </Prose>
      </Section>

      <Section id="privacy-hosting" title="GitHub Pages Hosting">
        <Prose>
          <p>
            The Site is hosted using GitHub Pages. GitHub states that when a GitHub Pages site is visited, the visitor's
            IP address is logged and stored for security purposes. This hosting-level processing is performed by
            GitHub's infrastructure and is separate from Suno Workbench's local creative processing.
          </p>
          <p>
            To the extent SEVNTHLABS has access to or otherwise processes limited hosting information for Site
            operation, security or abuse prevention, SEVNTHLABS is the data controller for that limited processing.
            GitHub also processes information under its own privacy terms.
          </p>
          <p>
            See{" "}
            <ExternalLink href="https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages">
              GitHub's GitHub Pages documentation
            </ExternalLink>{" "}
            and{" "}
            <ExternalLink href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">
              GitHub's General Privacy Statement
            </ExternalLink>
            .
          </p>
        </Prose>
      </Section>

      <Section id="privacy-use" title="How Information Is Used">
        <Prose>
          <p>
            Because SEVNTHLABS does not receive your Suno Workbench creative content, we do not use it for analytics,
            advertising, model training, profiling or marketing. Limited information voluntarily sent by email is used
            to answer the request, investigate a reported problem or maintain the Site.
          </p>
          <p>
            Limited GitHub Pages hosting information may be processed for security, abuse prevention, availability and
            legal compliance consistent with the purposes described above.
          </p>
        </Prose>
      </Section>

      <Section id="privacy-cookies" title="Cookies, Analytics and Tracking">
        <Prose>
          <p>
            Suno Workbench itself does not set cookies and does not use analytics, advertising pixels, behavioral
            tracking, fingerprinting or third-party analytics services. Local browser storage used for application
            state is functional device storage, not cross-site tracking.
          </p>
          <p>
            External websites you choose to visit from links in the Guide, including Suno and GitHub, operate under
            their own privacy policies and may use their own cookies or tracking technologies.
          </p>
        </Prose>
      </Section>

      <Section id="privacy-security" title="Data Security">
        <Prose>
          <p>
            Keeping creative content local reduces the amount of data exposed to network transmission. The hosted Site
            also uses a restrictive Content Security Policy that blocks application network connections and limits
            executable resources to the site's own files. The offline build embeds its application assets so it can run
            without an internet connection.
          </p>
          <p>
            Your device and browser remain responsible for protecting locally stored information. Anyone with access to
            your browser profile or exported history files may be able to read that data, so use device-level security
            appropriate to the sensitivity of your work.
          </p>
        </Prose>
      </Section>

      <Section id="privacy-rights" title="Your Rights and Choices">
        <Prose>
          <p>
            Depending on where you live, applicable privacy law may provide rights such as access, correction, deletion,
            restriction or objection regarding personal information a controller holds about you. Because SEVNTHLABS
            does not receive your prompts, lyrics or generated content, we generally have no server-side copy of that
            creative data to access, correct or delete.
          </p>
          <p>
            You control local Suno Workbench data through the browser and the application's clear-history controls. For
            questions or requests concerning limited information that may be held by SEVNTHLABS, email{" "}
            <a className="underline underline-offset-2 text-[var(--fg)]" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            . We may need enough information to verify and respond to a request where required by law.
          </p>
        </Prose>
      </Section>

      <Section id="privacy-third-parties" title="Third-Party Services and Links">
        <Prose>
          <p>
            Suno Workbench is independent from Suno, Inc. Links to Suno Help Center, Suno Terms, GitHub and other
            external sites are provided for reference. Leaving Suno Workbench means the destination site's terms and
            privacy practices apply. SEVNTHLABS does not control those third-party services.
          </p>
        </Prose>
      </Section>

      <Section id="privacy-updates" title="Policy Updates">
        <Prose>
          <p>
            We may update this Policy when the Site's architecture, hosting, legal requirements or privacy practices
            change. The revision date at the top of this page will be updated when a new version is published. Material
            changes will be described clearly on the Site or in the repository when appropriate.
          </p>
        </Prose>
      </Section>

      <Section id="privacy-contact" title="Contact">
        <Prose>
          <p>
            Questions about this Privacy Policy or SEVNTHLABS privacy practices may be sent to{" "}
            <a className="underline underline-offset-2 text-[var(--fg)]" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Prose>
      </Section>
    </ContentPage>
  );
}
