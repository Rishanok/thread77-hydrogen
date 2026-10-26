import {useLoaderData} from 'react-router';
import type {Route} from './+types/pages.$handle';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';

export const meta: Route.MetaFunction = ({data}) => {
  return [{title: `Thread77 | ${data?.page.title ?? ''}`}];
};

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, request, params}: Route.LoaderArgs) {
  if (!params.handle) {
    throw new Error('Missing page handle');
  }

  const [{page}] = await Promise.all([
    context.storefront.query(PAGE_QUERY, {
      variables: {
        handle: params.handle,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!page) {
    throw new Response('Not Found', {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle: params.handle, data: page});

  return {
    page,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Page() {
  const {page} = useLoaderData<typeof loader>();

  if (
    /contact/i.test(page.handle) ||
    /contact/i.test(page.title.trim())
  ) {
    return <ContactPage title={page.title} body={page.body} />;
  }

  return (
    <div className="page">
      <header>
        <h1>{page.title}</h1>
      </header>
      <main dangerouslySetInnerHTML={{__html: page.body}} />
    </div>
  );
}

function ContactPage({title, body}: {title: string; body: string}) {
  const email =
    body.match(/mailto:([^\s"'<>?]+)/i)?.[1] ??
    body.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0] ??
    '';
  const whatsappNumber = (
    body.match(/(?:wa\.me\/|phone=)(\+?\d{8,15})/i)?.[1] ??
    body.match(/tel:\+?([\d\s().-]{8,})/i)?.[1] ??
    ''
  ).replace(/\D/g, '');
  const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}` : '';
  const instagram = 'https://www.instagram.com/thread77.co/';
  const collaborationBody = encodeURIComponent(
    'Hi Thread77,\n\nI would love to discuss a creator collaboration.\n\nName:\nSocial profile(s):\nAudience and location:\nContent idea:\nMedia kit or portfolio:\n',
  );

  return (
    <div className="t77-contact-page">
      <section className="t77-contact-hero">
        <p className="t77-contact-eyebrow">THREAD77 / CONTACT</p>
        <h1>{title || 'Let’s connect.'}</h1>
        <p>
          Need a hand with an order, have a question about a piece, or want to
          create something together? We’d love to hear from you.
        </p>
      </section>

      <section className="t77-contact-details" aria-label="Contact details">
        <div className="t77-contact-details__intro">
          <p className="t77-contact-eyebrow">CUSTOMER CARE</p>
          <h2>Here to help.</h2>
          <p>For order support, product questions, or anything else, reach us here.</p>
        </div>
        <div className="t77-contact-methods">
          {whatsappUrl && (
            <ContactMethodCard
              href={whatsappUrl}
              channel="WhatsApp"
              title="Chat with our team"
              detail="Order help, product questions, and quick support."
              action="Start a chat"
              icon="whatsapp"
            />
          )}
          {email && (
            <ContactMethodCard
              href={`mailto:${email}`}
              channel="Email"
              title={email}
              detail="For order support and other questions."
              action="Send email"
              icon="email"
              external={false}
            />
          )}
          {instagram && (
            <ContactMethodCard
              href={instagram}
              channel="Instagram"
              title="@thread77.co"
              detail="Questions, outfit ideas, or a collaboration pitch."
              action="Send us a DM"
              icon="instagram"
            />
          )}
        </div>
      </section>

      <section className="t77-creator-invite" aria-labelledby="t77-creator-title">
        <div>
          <p className="t77-contact-eyebrow">THREAD77 / CREATOR COLLABORATIONS</p>
          <h2 id="t77-creator-title">Your point of view belongs here.</h2>
          <p>
            We’re looking to work with creators who bring personal style and
            honest storytelling to what they wear. Share your profile, audience,
            and the idea you’d like to make with Thread77.
          </p>
          {whatsappUrl ? (
            <a
              className="t77-creator-invite__cta"
              href={`${whatsappUrl}?text=${collaborationBody}`}
            >
              Pitch us on WhatsApp <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <a
              className="t77-creator-invite__cta"
              href={instagram}
              target="_blank"
              rel="noreferrer"
            >
              Pitch us on Instagram <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
        <aside>
          <span>01 — YOUR CHANNEL</span>
          <span>02 — YOUR AUDIENCE</span>
          <span>03 — YOUR IDEA</span>
          <p>Tell us what makes your voice and style your own.</p>
        </aside>
      </section>
    </div>
  );
}

function ContactMethodCard({
  href,
  channel,
  title,
  detail,
  action,
  icon,
  external = true,
}: {
  href: string;
  channel: string;
  title: string;
  detail: string;
  action: string;
  icon: 'whatsapp' | 'instagram' | 'email';
  external?: boolean;
}) {
  return (
    <a
      className={`t77-contact-card t77-contact-card--${icon}`}
      href={href}
      aria-label={`${action}: ${channel}`}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
    >
      <span className="t77-contact-card__icon" aria-hidden="true">
        {icon === 'instagram' ? (
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle className="t77-contact-card__icon-dot" cx="17.7" cy="6.7" r="1" />
          </svg>
        ) : icon === 'whatsapp' ? (
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M20.2 11.7a8.1 8.1 0 0 1-11.8 7.2L3.5 20l1.1-4.7a8.1 8.1 0 1 1 15.6-3.6Z" />
            <path d="M9 8.2c.3-.4.7-.3.9.1l.7 1.6c.1.3 0 .5-.3.8l-.5.5c.6 1.1 1.5 2 2.7 2.6l.5-.6c.2-.2.5-.3.8-.1l1.5.7c.4.2.4.6.1.9-.5.7-1.2 1.1-2.1 1-2.9-.3-6.3-3.6-6.6-6.4-.1-.5.8-1.1 1.3-1.1Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m4 7 8 6 8-6" />
          </svg>
        )}
      </span>
      <span className="t77-contact-card__content">
        <span className="t77-contact-card__channel">{channel}</span>
        <strong>{title}</strong>
        <span className="t77-contact-card__detail">{detail}</span>
      </span>
      <span className="t77-contact-card__action">
        {action} <span aria-hidden="true">↗</span>
      </span>
    </a>
  );
}

const PAGE_QUERY = `#graphql
  query Page(
    $language: LanguageCode,
    $country: CountryCode,
    $handle: String!
  )
  @inContext(language: $language, country: $country) {
    page(handle: $handle) {
      handle
      id
      title
      body
      seo {
        description
        title
      }
    }
  }
` as const;
