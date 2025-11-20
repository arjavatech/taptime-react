import React from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';

const PrivacyPolicyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b text-foreground">
          <h2 className="text-2xl font-bold">Privacy Policy</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4 text-foreground">
            <p>Last updated: October 1, 2024</p>
            <p>This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.</p>
            <p>We use Your Personal data to provide and improve the Service. By using the Service, You agree to the collection and use of information in accordance with this Privacy Policy.</p>
            
            <h2 className="text-xl font-semibold">Interpretation and Definitions</h2>
            <h3 className="text-lg font-semibold">Interpretation</h3>
            <p>The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.</p>
            
            <h3 className="text-lg font-semibold">Definitions</h3>
            <p>For the purposes of this Privacy Policy:</p>
            <ul className="pl-6 space-y-2">
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Account</strong> means a unique account created for You to access our Service or parts of our Service.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Affiliate</strong> means an entity that controls, is controlled by or is under common control with a party, where "control" means ownership of 50% or more of the shares, equity interest or other securities entitled to vote for election of directors or other managing authority.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Business</strong>, for the purpose of CCPA/CPRA, refers to the Company as the legal entity that collects Consumers' personal information and determines the purposes and means of the processing of Consumers' personal information.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>CCPA</strong> and/or <strong>CPRA</strong> refers to the California Consumer Privacy Act (the "CCPA") as amended by the California Privacy Rights Act of 2020 (the "CPRA").</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Company</strong> (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to Arjava Technologies, ARJAVA INDIA TECH PRIVATE LIMITED 2135, 2024th pl ne, Sammamish,WA 98074. For the purpose of the GDPR, the Company is the Data Controller.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Consumer</strong>, for the purpose of the CCPA/CPRA, means a natural person who is a California resident.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Cookies</strong> are small files that are placed on Your computer, mobile device or any other device by a website, containing the details of Your browsing history on that website among its many uses.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Country</strong> refers to: United States of America</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Data Controller</strong>, for the purposes of the GDPR (General Data Protection Regulation), refers to the Company as the legal person which alone or jointly with others determines the purposes and means of the processing of Personal Data.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Device</strong> means any device that can access the Service such as a computer, a cellphone or a digital tablet.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Do Not Track</strong> (DNT) is a concept that has been promoted by US regulatory authorities, in particular the U.S. Federal Trade Commission (FTC), for the Internet industry to develop and implement a mechanism for allowing internet users to control the tracking of their online activities across websites.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>GDPR</strong> refers to EU General Data Protection Regulation.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Personal Data</strong> is any information that relates to an identified or identifiable individual. For the purposes of GDPR, Personal Data means any information relating to You such as a name, an identification number, location data, online identifier or to one or more factors specific to the physical, physiological, genetic, mental, economic, cultural or social identity. For the purposes of the CCPA/CPRA, Personal Data means any information that identifies, relates to, describes or is capable of being associated with, or could reasonably be linked, directly or indirectly, with You.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Service</strong> refers to the Website.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Service Provider</strong> means any natural or legal person who processes the data on behalf of the Company. It refers to third-party companies or individuals employed by the Company to facilitate the Service, to provide the Service on behalf of the Company, to perform services related to the Service or to assist the Company in analyzing how the Service is used. For the purpose of the GDPR, Service Providers are considered Data Processors.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Usage Data</strong> refers to data collected automatically, either generated by the use of the Service or from the Service infrastructure itself (for example, the duration of a page visit).</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Website</strong> refers to Tap-Time, accessible from <a className="text-blue-600 hover:underline hover:text-blue-700" href="https://tap-time.com">https://tap-time.com</a></p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>You</strong> means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable. Under GDPR, You can be referred to as the Data Subject or as the User as you are the individual using the Service.</p></li>
            </ul>

            <h2 className="text-xl font-semibold">Collecting and Using Your Personal Data</h2>
            <h3 className="text-lg font-semibold">Types of Data Collected</h3>
            <h4 className="text-base font-semibold">Personal Data</h4>
            <p>While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You. Personally identifiable information may include, but is not limited to:</p>
            <ul className="pl-6 space-y-2">
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><h6 className="font-semibold">Email address</h6></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><div><h6 className="font-semibold">Camera Access</h6><p>Our application(Tap-Time) requires access to the device's camera to enable facial recognition. This feature is used solely for client-side operations, such as user authentication or personalization. Images and facial recognition data captured by the camera are stored only on the local device and are not transmitted or stored on our servers. No camera data is shared with third parties or stored externally, ensuring the security and privacy of your information.</p></div></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><h6 className="font-semibold">Usage Data</h6></li>
            </ul>

            <h4 className="text-base font-semibold">Usage Data</h4>
            <p>Usage Data is collected automatically when using the Service.</p>
            <p>Usage Data may include information such as Your Device's Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that You visit, the time and date of Your visit, the time spent on those pages, unique device identifiers and other diagnostic data.</p>
            <p>When You access the Service by or through a mobile device, We may collect certain information automatically, including, but not limited to, the type of mobile device You use, Your mobile device unique ID, the IP address of Your mobile device, Your mobile operating system, the type of mobile Internet browser You use, unique device identifiers and other diagnostic data.</p>
            <p>We may also collect information that Your browser sends whenever You visit our Service or when You access the Service by or through a mobile device.</p>

            <h4 className="text-base font-semibold">Tracking Technologies and Cookies</h4>
            <p>We use Cookies and similar tracking technologies to track the activity on Our Service and store certain information. Tracking technologies used are beacons, tags, and scripts to collect and track information and to improve and analyze Our Service. The technologies We use may include:</p>
            <ul className="pl-6 space-y-2">
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Cookies or Browser Cookies.</strong> A cookie is a small file placed on Your Device. You can instruct Your browser to refuse all Cookies or to indicate when a Cookie is being sent. However, if You do not accept Cookies, You may not be able to use some parts of our Service. Unless you have adjusted Your browser setting so that it will refuse Cookies, our Service may use Cookies.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Web Beacons.</strong> Certain sections of our Service and our emails may contain small electronic files known as web beacons (also referred to as clear gifs, pixel tags, and single-pixel gifs) that permit the Company, for example, to count users who have visited those pages or opened an email and for other related website statistics.</p></li>
            </ul>
            <p>Cookies can be "Persistent" or "Session" Cookies. Persistent Cookies remain on Your personal computer or mobile device when You go offline, while Session Cookies are deleted as soon as You close Your web browser.</p>
            <p>We use both Session and Persistent Cookies for the purposes set out below:</p>
            <ul className="pl-6 space-y-2">
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><div><p><strong>Necessary / Essential Cookies</strong></p><p>Type: Session Cookies</p><p>Administered by: Us</p><p>Purpose: These Cookies are essential to provide You with services available through the Website and to enable You to use some of its features.</p></div></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><div><p><strong>Cookies Policy / Notice Acceptance Cookies</strong></p><p>Type: Persistent Cookies</p><p>Administered by: Us</p><p>Purpose: These Cookies identify if users have accepted the use of cookies on the Website.</p></div></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><div><p><strong>Functionality Cookies</strong></p><p>Type: Persistent Cookies</p><p>Administered by: Us</p><p>Purpose: These Cookies allow us to remember choices You make when You use the Website.</p></div></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><div><p><strong>Tracking and Performance Cookies</strong></p><p>Type: Persistent Cookies</p><p>Administered by: Third-Parties</p><p>Purpose: These Cookies are used to track information about traffic to the Website and how users use the Website.</p></div></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><div><p><strong>Targeting and Advertising Cookies</strong></p><p>Type: Persistent Cookies</p><p>Administered by: Third-Parties</p><p>Purpose: These Cookies track your browsing habits to enable Us to show advertising which is more likely to be of interest to You.</p></div></li>
            </ul>

            <h3 className="text-lg font-semibold">Use of Your Personal Data</h3>
            <p>The Company may use Personal Data for the following purposes:</p>
            <ul className="pl-6 space-y-2">
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>To provide and maintain our Service</strong>, including to monitor the usage of our Service.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>To manage Your Account:</strong> to manage Your registration as a user of the Service. The Personal Data You provide can give You access to different functionalities of the Service that are available to You as a registered user.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>For the performance of a contract:</strong> the development, compliance and undertaking of the purchase contract for the products, items or services You have purchased or of any other contract with Us through the Service.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>To contact You:</strong> To contact You by email, telephone calls, SMS, or other equivalent forms of electronic communication, such as a mobile application's push notifications regarding updates or informative communications related to the functionalities, products or contracted services, including the security updates, when necessary or reasonable for their implementation.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>To provide You</strong> with news, special offers and general information about other goods, services and events which we offer that are similar to those that you have already purchased or enquired about unless You have opted not to receive such information.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>To manage Your requests:</strong> To attend and manage Your requests to Us.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>For business transfers:</strong> We may use Your information to evaluate or conduct a merger, divestiture, restructuring, reorganization, dissolution, or other sale or transfer of some or all of Our assets.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>For other purposes</strong>: We may use Your information for other purposes, such as data analysis, identifying usage trends, determining the effectiveness of our promotional campaigns and to evaluate and improve our Service.</p></li>
            </ul>
            <p>We may share Your personal information in the following situations:</p>
            <ul className="pl-6 space-y-2">
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>With Service Providers:</strong> We may share Your personal information with Service Providers to monitor and analyze the use of our Service.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>For business transfers:</strong> We may share or transfer Your personal information in connection with any merger, sale of Company assets, financing, or acquisition.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>With Affiliates:</strong> We may share Your information with Our affiliates.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>With business partners:</strong> We may share Your information with Our business partners.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>With other users:</strong> when You share personal information or otherwise interact in the public areas with other users.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>With Your consent</strong>: We may disclose Your personal information for any other purpose with Your consent.</p></li>
            </ul>

            <h3 className="text-lg font-semibold">Retention of Your Personal Data</h3>
            <p>The Company will retain Your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use Your Personal Data to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our legal agreements and policies.</p>
            <p>The Company will also retain Usage Data for internal analysis purposes. Usage Data is generally retained for a shorter period of time, except when this data is used to strengthen the security or to improve the functionality of Our Service, or We are legally obligated to retain this data for longer time periods.</p>

            <h3 className="text-lg font-semibold">Transfer of Your Personal Data</h3>
            <p>Your information, including Personal Data, is processed at the Company's operating offices and in any other places where the parties involved in the processing are located. It means that this information may be transferred to — and maintained on — computers located outside of Your state, province, country or other governmental jurisdiction where the data protection laws may differ than those from Your jurisdiction.</p>
            <p>Your consent to this Privacy Policy followed by Your submission of such information represents Your agreement to that transfer.</p>
            <p>The Company will take all steps reasonably necessary to ensure that Your data is treated securely and in accordance with this Privacy Policy and no transfer of Your Personal Data will take place to an organization or a country unless there are adequate controls in place including the security of Your data and other personal information.</p>

            <h3 className="text-lg font-semibold">Delete Your Personal Data</h3>
            <p>You have the right to delete or request that We assist in deleting the Personal Data that We have collected about You.</p>
            <p>Our Service may give You the ability to delete certain information about You from within the Service.</p>
            <p>You may update, amend, or delete Your information at any time by signing in to Your Account, if you have one, and visiting the account settings section that allows you to manage Your personal information. You may also contact Us to request access to, correct, or delete any personal information that You have provided to Us.</p>
            <p>Please note, however, that We may need to retain certain information when we have a legal obligation or lawful basis to do so.</p>

            <h3 className="text-lg font-semibold">Disclosure of Your Personal Data</h3>
            <h4 className="text-base font-semibold">Business Transactions</h4>
            <p>If the Company is involved in a merger, acquisition or asset sale, Your Personal Data may be transferred. We will provide notice before Your Personal Data is transferred and becomes subject to a different Privacy Policy.</p>

            <h4 className="text-base font-semibold">Law enforcement</h4>
            <p>Under certain circumstances, the Company may be required to disclose Your Personal Data if required to do so by law or in response to valid requests by public authorities (e.g. a court or a government agency).</p>
            
            <h4 className="text-base font-semibold">Other legal requirements</h4>
            <p>The Company may disclose Your Personal Data in the good faith belief that such action is necessary to:</p>
            <ul className="pl-6">
                <li className="flex gap-2"><span className="text-lg leading-none">•</span>Comply with a legal obligation</li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span>Protect and defend the rights or property of the Company</li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span>Prevent or investigate possible wrongdoing in connection with the Service</li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span>Protect the personal safety of Users of the Service or the public</li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span>Protect against legal liability</li>
            </ul>

            <h3 className="text-base font-semibold">Security of Your Personal Data</h3>
            <p>The security of Your Personal Data is important to Us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While We strive to use commercially acceptable means to protect Your Personal Data, We cannot guarantee its absolute security.</p>

            <h2 className="text-xl font-semibold">Detailed Information on the Processing of Your Personal Data</h2>
            <p>The Service Providers We use may have access to Your Personal Data. These third-party vendors collect, store, use, process and transfer information about Your activity on Our Service in accordance with their Privacy Policies.</p>

            <h3 className="text-lg font-semibold">Analytics</h3>
            <p>We may use third-party Service providers to monitor and analyze the use of our Service.</p>
            <ul className="pl-6 space-y-2">
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><div><p><strong>Google Analytics</strong></p><p>Google Analytics is a web analytics service offered by Google that tracks and reports website traffic. For more information on the privacy practices of Google, please visit: <a href="https://policies.google.com/privacy" target="_blank" className="text-blue-600 hover:underline">https://policies.google.com/privacy</a></p></div></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><div><p><strong>Firebase</strong></p><p>Firebase is an analytics service provided by Google Inc. For more information: <a href="https://policies.google.com/privacy" target="_blank" className="text-blue-600 hover:underline">https://policies.google.com/privacy</a></p></div></li>
            </ul>

            <h3 className="text-lg font-semibold">Advertising</h3>
            <p>We may process Personal Data under the following conditions:</p>
            <ul className="pl-6 space-y-2">
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Consent:</strong> You have given Your consent for processing Personal Data for one or more specific purposes.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Performance of a contract:</strong> Provision of Personal Data is necessary for the performance of an agreement with You.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Legal obligations:</strong> Processing Personal Data is necessary for compliance with a legal obligation.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Vital interests:</strong> Processing Personal Data is necessary in order to protect Your vital interests.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Public interests:</strong> Processing Personal Data is related to a task that is carried out in the public interest.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Legitimate interests:</strong> Processing Personal Data is necessary for the purposes of the legitimate interests pursued by the Company.</p></li>
            </ul>

            <h3 className="text-lg font-semibold">Your Rights under the GDPR</h3>
            <p>The Company undertakes to respect the confidentiality of Your Personal Data and to guarantee You can exercise Your rights.</p>
            <p>You have the right under this Privacy Policy, and by law if You are within the EU, to:</p>
            <ul className="pl-6 space-y-2">
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Request access to Your Personal Data.</strong> The right to access, update or delete the information We have on You.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Request correction of the Personal Data that We hold about You.</strong> You have the right to have any incomplete or inaccurate information We hold about You corrected.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Object to processing of Your Personal Data.</strong> This right exists where We are relying on a legitimate interest as the legal basis for Our processing.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Request erasure of Your Personal Data.</strong> You have the right to ask Us to delete or remove Personal Data when there is no good reason for Us to continue processing it.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Request the transfer of Your Personal Data.</strong> We will provide to You, or to a third-party You have chosen, Your Personal Data in a structured, commonly used, machine-readable format.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>Withdraw Your consent.</strong> You have the right to withdraw Your consent on using your Personal Data.</p></li>
            </ul>

            <h3 className="text-lg font-semibold">Exercising of Your GDPR Data Protection Rights</h3>
            <p>You may exercise Your rights of access, rectification, cancellation and opposition by contacting Us. Please note that we may ask You to verify Your identity before responding to such requests.</p>
            <p>You have the right to complain to a Data Protection Authority about Our collection and use of Your Personal Data.</p>

            <h2 className="text-xl font-semibold">CCPA/CPRA Privacy Notice</h2>
            <p>This privacy notice section for California residents supplements the information contained in Our Privacy Policy and it applies solely to all visitors, users, and others who reside in the State of California.</p>

            <h3 className="text-lg font-semibold">Categories of Personal Information Collected</h3>
            <p>We collect information that identifies, relates to, describes, references, is capable of being associated with, or could reasonably be linked, directly or indirectly, with a particular Consumer or Device.</p>
            <ul className="pl-6 space-y-2">
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><div><p><strong>Category A: Identifiers.</strong></p><p>Examples: A real name, alias, postal address, unique personal identifier, online identifier, Internet Protocol address, email address, account name.</p><p>Collected: Yes.</p></div></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><div><p><strong>Category B: Personal information categories listed in the California Customer Records statute.</strong></p><p>Examples: A name, signature, Social Security number, physical characteristics or description, address, telephone number.</p><p>Collected: Yes.</p></div></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><div><p><strong>Category F: Internet or other similar network activity.</strong></p><p>Examples: Interaction with our Service or advertisement.</p><p>Collected: Yes.</p></div></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><div><p><strong>Category L: Sensitive personal information.</strong></p><p>Examples: Account login and password information, geolocation data.</p><p>Collected: Yes.</p></div></li>
            </ul>

            <h3 className="text-lg font-semibold">Your Rights under the CCPA/CPRA</h3>
            <p>The CCPA/CPRA provides California residents with specific rights regarding their personal information. If You are a resident of California, You have the following rights:</p>
            <ul className="pl-6 space-y-2">
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>The right to notice.</strong> You have the right to be notified which categories of Personal Data are being collected.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>The right to know/access.</strong> You have the right to request that We disclose information to You about Our collection, use, sale, disclosure for business purposes and share of personal information.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>The right to say no to the sale or sharing of Personal Data (opt-out).</strong> You have the right to direct Us to not sell Your personal information.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>The right to correct Personal Data.</strong> You have the right to correct or rectify any inaccurate personal information about You that We collected.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>The right to delete Personal Data.</strong> You have the right to request the deletion of Your Personal Data under certain circumstances.</p></li>
                <li className="flex gap-2"><span className="text-lg leading-none">•</span><p><strong>The right not to be discriminated against.</strong> You have the right not to be discriminated against for exercising any of Your consumer's rights.</p></li>
            </ul>

            <h2 className="text-xl font-semibold">"Do Not Track" Policy as Required by California Online Privacy Protection Act (CalOPPA)</h2>
            <p>Our Service does not respond to Do Not Track signals.</p>
            <p>However, some third party websites do keep track of Your browsing activities. If You are visiting such websites, You can set Your preferences in Your web browser to inform websites that You do not want to be tracked.</p>

            <h2 className="text-xl font-semibold">Your California Privacy Rights (California's Shine the Light law)</h2>
            <p>Under California Civil Code Section 1798 (California's Shine the Light law), California residents with an established business relationship with us can request information once a year about sharing their Personal Data with third parties for the third parties' direct marketing purposes.</p>

            <h2 className="text-xl font-semibold">California Privacy Rights for Minor Users</h2>
            <p>California Business and Professions Code Section 22581 allows California residents under the age of 18 who are registered users of online sites, services or applications to request and obtain removal of content or information they have publicly posted.</p>

            <h2 className="text-xl font-semibold">Children's Privacy</h2>
            <p>Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from anyone under the age of 13. If You are a parent or guardian and You are aware that Your child has provided Us with Personal Data, please contact Us. If We become aware that We have collected Personal Data from anyone under the age of 13 without verification of parental consent, We take steps to remove that information from Our servers.</p>
            <p>If We need to rely on consent as a legal basis for processing Your information and Your country requires consent from a parent, We may require Your parent's consent before We collect and use that information.</p>

            <h2 className="text-xl font-semibold">Links to Other Websites</h2>
            <p>Our Service may contain links to other websites that are not operated by Us. If You click on a third party link, You will be directed to that third party's site. We strongly advise You to review the Privacy Policy of every site You visit.</p>
            <p>We have no control over and assume no responsibility for the content, privacy policies or practices of any third party sites or services.</p>

            <h2 className="text-xl font-semibold">Changes to this Privacy Policy</h2>
            <p>We may update Our Privacy Policy from time to time. We will notify You of any changes by posting the new Privacy Policy on this page.</p>
            <p>We will let You know via email and/or a prominent notice on Our Service, prior to the change becoming effective and update the "Last updated" date at the top of this Privacy Policy.</p>
            <p>You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>

            <h2 className="text-xl font-semibold">Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, you can <a href="https://tap-time.com/index.html#contact" target="_blank" className="text-blue-600 hover:underline">Connect Us</a></p>
            <div className="bg-muted p-4 rounded-lg mt-2">
                <p><strong>Arjava Technologies</strong></p>
                <p>2135 204th PL NE</p>
                <p>Sammamish, WA 98074</p>
                <p>Phone: (541) 371-2950</p>
                <p>Email: contact@tap-time.com</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6">
          <Button onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;