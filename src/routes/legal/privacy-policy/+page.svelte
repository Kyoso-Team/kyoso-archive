<script lang="ts">
  import env from '$lib/env/client';
  import { SEO } from '$components';
  import { page } from '$app/stores';
</script>

<SEO
  page={$page}
  title="Privacy - Kyoso"
  description="Privacy policy"
  image={{
    url: `${$page.url.origin}/seo/privacy.png`,
    alt: 'kyoso-privacy-policy-banner',
    height: 630,
    width: 1200,
    twitterCardType: 'summary_large_image'
  }}
/>
<div class="center-content">
  <div class="document">
    <h1>Privacy Policy</h1>
    <p>
      The following describes how Kyoso ("Kyoso", "we", "us" and/or "our") at <a
        href={$page.url.origin}>{$page.url.origin}</a
      > ("site"), collects and manages information ("personal data") about our users ("end users").
    </p>
    <h2>Information We Collect</h2>
    <h3>Third Party Information</h3>
    <p>
      Most of the information we collect and process is obtained from the osu! and Discord APIs
      ("third parties"). Such information can be broken down as such:
    </p>
    <p><b>osu!</b></p>
    <ul>
      <li>User ID</li>
      <li>Username</li>
      <li>Account status (is the user restricted or not).</li>
      <li>Country's name</li>
      <li>Country's ISO 3166 alpha-2 code.</li>
      <li>OAuth access token</li>
      <li>OAuth refresh token</li>
    </ul>
    <p><b>Discord</b></p>
    <ul>
      <li>User ID</li>
      <li>Username</li>
      <li>Discriminator (the four digits at the end of a user's tag).</li>
      <li>OAuth access token</li>
      <li>OAuth refresh token</li>
    </ul>
    <h3>First Party Information</h3>
    <p>We collect the following information directly or indirectly from the user:</p>
    <ul>
      <li>Timezone offset</li>
    </ul>
    <h2>Payment Processing</h2>
    <p>
      Services on Kyoso require a payment to be processed (unless stated otherwise). We do not
      collect or process any data related to payments directly, instead, we use a third party
      service (PayPal) to handle this for us, meaning that we don't have access to a user's billing
      information at any given moment.
    </p>
    <p>Each time a transaction is made, we collect the following information:</p>
    <ul>
      <li>PayPal order ID</li>
      <li>Who (referring to a user on Kyoso) made the transaction.</li>
      <li>
        For what tournament was it purchased for (if a tournament is deleted, this piece of
        information is also deleted).
      </li>
    </ul>
    <p>
      Kyoso administrators can view the previously mentioned information for all transactions made
      on the site. A user can view the information related to their own transactions.
    </p>
    <h2>How We Process Information</h2>
    <p>
      The information we collect is not used to modify, create or delete data related to third party
      accounts (osu! and Discord). The user's information is mainly used to help Kyoso's
      administrators and tournament hosts to identify who they are on the site.
    </p>
    <p>The processes we do relating to a user's information are:</p>
    <ul>
      <li>Providing you access to certain functionality on the site.</li>
      <li>Processing and completing transactions.</li>
      <li>Detecting user misbehavior.</li>
      <li>Conducting statistical analyses of the user's usage on the site.</li>
    </ul>
    <h2>How We Store Information</h2>
    <p>
      The information we store is stored securely in a database, no public or private API endpoint
      or page on the site exposes sensitive data such as OAuth access and refresh tokens.
    </p>
    <p>
      We also store basic user information through a cookie that contains a signed JSON Web Token
      (JWT). Said cookie contains:
    </p>
    <ul>
      <li>(Kyoso) User ID</li>
      <li>osu! User ID</li>
      <li>osu! Username</li>
      <li>Discord Tag (Discord username with its discriminator).</li>
    </ul>
    <h2>Who Has Access To User information</h2>
    <p>
      Kyoso administrators can view all of the information detailed in this privacy policy with the
      exception of a user's OAuth access and refresh tokens. Administrators won't modify or delete
      said information unless specified otherwise or given consent to do so by the user.
    </p>
    <h2>Third Party Sites</h2>
    <p>
      This privacy policy only applies to Kyoso. The site may contain various links to other sites
      (“third party sites”) where this privacy policy doesn't apply. Some links being on the site
      does not imply that we have reviewed or endorsed them in any way.
    </p>
    <h2>Contact Us</h2>
    <p>
      If you have any questions or concerns regarding our privacy policy, feel free to contact us at {env.PUBLIC_CONTACT_EMAIL}.
    </p>
    <br />
    <p><b>Last updated: April 18th, 2023.</b></p>
  </div>
</div>
