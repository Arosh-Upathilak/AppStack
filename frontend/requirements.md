Software Requirement Specification
AppStack
Date: 2026/04/06
Version: 1.0.0
Revision: v1
SRS – AppStack – Flexaro Pvt Ltd.
Contents
1. Introduction .................................................................................................................................... 4
1.1 Purpose .................................................................................................................................. 4
1.2 Intended Audience ................................................................................................................ 4
1.3 Product Scope ........................................................................................................................ 4
1.4 Future Developments ............................................................................................................ 4
2. Overall Description .......................................................................................................................... 5
2.1 User Needs ............................................................................................................................ 5
3. System Features and Requirements ................................................................................................ 6
3.1 Functional Requirements ....................................................................................................... 6
3.1.1 E-commerce & Product Discovery ..................................................................................... 6
3.1.2 User Registration ............................................................................................................... 6
3.2.4 User Login .......................................................................................................................... 6
3.2.4 Account Recovery .............................................................................................................. 6
3.2.4 Subscribing to Product ...................................................................................................... 7
3.2.4 Subscription Management ................................................................................................ 7
3.2.4 View Buyers Invoice History .............................................................................................. 7
3.2.4 Credit Card Management .................................................................................................. 8
3.2.4 Payment Collection for Subscriptions ............................................................................... 8
3.2.4 Refunds .............................................................................................................................. 8
3.2.4 Create Products ................................................................................................................. 8
3.2.4 Change/Edit Product ......................................................................................................... 8
3.2.4 Delete Products ................................................................................................................. 9
3.2.4 View Products Lists on Seller Dashboard .......................................................................... 9
3.2.4 View Seller’s Earning ......................................................................................................... 9
3.2.4 Request Payout for Earnings ............................................................................................. 9
3.2.4 Scheduled Payments and Payouts ................................................................................... 10
3.2.4 System integrations and Events ....................................................................................... 10
3.2.4 Administrator User Management: .................................................................................. 10
3.2 Non-Functional Requirements ............................................................................................. 11
3.2.1 Scalability & Performance ............................................................................................... 11
3.2.2 Search Engine Optimization ............................................................................................ 11
3.2.3 Security Requirement ...................................................................................................... 11
3.2.4 User Interface .................................................................................................................. 11
2
SRS – AppStack – Flexaro Pvt Ltd.
4. Other Requirements...................................................................................................................... 11
4.1 4.1. Legal and Regulatory Requirements ............................................................................. 11
4.1.1 4.1.1 Application should be compliance with GDPR ....................................................... 11
3
SRS – AppStack – Flexaro Pvt Ltd.
1. Introduction
1.1 Purpose
This application provides a platform for users to manage multiple SaaS subscriptions in a single
dashboard. On the seller’s perspective it provides an automated payment collection system, reducing
the requirement of implementing payment gateways into the system.
1.2 Intended Audience
Users, business owners who want to manage multiple subscriptions from one single dashboard.
Saas owners, developers who are looking for generating audience for their application and easy
integration and collecting payments easily.
1.3 Product Scope
The application following components:
1. 2. 3. 4. 5. 6. Public E-commerce site – to view, search Saas products and subscribe to a plan.
User Dashboard – to manage user’s subscriptions, subscribe, unsubscribe, upgrade or
downgrade plans, manage payment methods and view invoices.
Seller dashboard – to create, edit or remove SaaS Products, publish to the admin approval.
Also allows to see subscriptions, cancellations and earnings. Allows to withdraw earnings.
Admin dashboard – Where admins can approve products, change product details, list them
or un-list them, manage subscriptions to user, handle refunds, and approve seller’s payouts.
Also allow to manage users, change their details, view consent details.
Automatically handle approved payouts, approved refunds, and monthly subscriptions.
Provide Seller side detailed low level REST API, with documentation for SaaS integration.
1.4 Future Developments
Following implementations are out of scope for current project, but will be useful in the future.
1. N8N Integration automation.
2. 3. Node JS Library + Python Library for easy integration.
Provide product level statistics like view count.
4
SRS – AppStack – Flexaro Pvt Ltd.
2. Overall Description
2.1 User Needs
User Type Needs
Guest / Public • Get learn about the service
• Navigate, search and select products
Buyers • Get learn about the service
• Navigate, search and select products
• Subscribe to a product
• Manage subscriptions from one dashboard
• Get refunds for products
• Having multiple subscription from a same product/plan for
different emails
Sellers (Vendors) • Gain customers for their SaaS product
• Collect payments
• Activate/cancel subscriptions automatically.
• Integrate platform easily to their platform
• Withdraw their earnings.
• Handle refunds easily.
Administrators • Manage users, sellers, and admins
• Manage products, subscriptions listed
• Approve refunds for users
• Approve payouts for sellers
• Approve product listings, editing and deletions.
Developers • Easy access to API documentation
• Test their applications on Sandbox environment
5
SRS – AppStack – Flexaro Pvt Ltd.
3. System Features and Requirements
3.1 Functional Requirements
3.1.1 E-commerce & Product Discovery
REQ-1: The system shall allow unauthorized users to visit home page, about page and other public
pages.
REQ-2: The system shall allow unauthorized users to search and view product catalogs.
REQ-3: The system shall allow unauthorized users to filter products based on price, category.
REQ-4: The system shall allow unauthorized users to view product details.
REQ-5: The system shall show unauthorized users the reviews placed by the buyers.
REQ-6: The system shall ask unauthorized users to log-in or register when selecting a plan.
REQ-7: The system shall allow users who has an active subscription or has purchased the
subscription to place review.
3.1.2 User Registration
REQ-8: The system shall provide a multi-step registration process where users can select account
type as buyer or seller.
REQ-9: The system shall verify the newly created user accounts before make active, using an email
OTP.
REQ-10: The system shall ask not activate seller accounts until an administrator approved by
manually reviewing.
REQ-11: The system shall allow user to have multiple roles such as buyer and seller at the same time.
3.2.4 User Login
REQ-12: The system shall provide email and password-based login for users.
3.2.4 Account Recovery
REQ-13: The system shall allow users to reset their password by sending password reset email.
6
SRS – AppStack – Flexaro Pvt Ltd.
3.2.4 Subscribing to Product
REQ-14: An authenticated buyer, shall be able to select a plan for the product.
REQ-15: An authenticated buyer shall be able to buy the plan for a different email from account
registered email, by verifying with an OTP.
REQ-16: The system shall ask for accepting the consent for share the email with the seller’s platform.
REQ-17: The system shall ask for credit card details if a card is not existing in the current user’s
wallet.
REQ-18: The system shall initiate a transaction when subscribing to the plan.
REQ-19: The system shall generate an invoice for the transaction.
REQ-20: The system shall inform buyer, and the seller about the transaction via email notifications.
REQ-21: The system shall inform the seller’s SaaS platform via calling to a webhook to create and
activate the plan.
REQ-22: The system shall put the plan into pending status and wait for SaaS application’s response.
3.2.4 Subscription Management
REQ-23: The buyers shall be able to see their active subscription plans with price and payment dates.
REQ-24: The system shall allow buyers to upgrade, downgrade or cancel a subscription.
REQ-25: The system shall notify the SaaS platform about the change of plan. It must wait for SaaS
application’s response to take effect.
REQ-26: The system shall allow buyers to purchase multiple subscriptions from same plan.
REQ-27: Subscription cancellation shall be notified to administrators and require an approval from
the administrator.
3.2.4 View Buyers Invoice History
REQ-28: The system shall keep buyers invoices up to 5 years or more.
REQ-29: The system shall allow buyers to see their invoices and payment history.
REQ-30: The system shall allow buyers to download the invoices.
7
SRS – AppStack – Flexaro Pvt Ltd.
3.2.4 Credit Card Management
REQ-31: The system shall allow buyers to add/remove multiple credit cards.
REQ-32: The system shall allow buyers to mark a one credit card as primary.
3.2.4 Payment Collection for Subscriptions
REQ-33: The system shall collect payments for buyer’s subscription based on a schedule.
REQ-34: The system shall retry up-to three times within few days for each card added if payment
was unsuccess full.
REQ-35: The system shall inform payment fails and successes to the SaaS application via the
webhook.
3.2.4 Refunds
REQ-36: The system shall allow seller to enable refunds for product/plan.
REQ-37: The system shall allow buyer to request a refund within 30 days of payment.
REQ-38: The system shall request approval for the refunds from the administrators.
REQ-39: The system shall proceed refunds automatically according to a schedule.
3.2.4 Create Products
REQ-40: The system shall provide inputs a verified seller to enter details of the product.
REQ-41: A Product may have following properties,
1. Title/Name
2. Description
3. Short Description
4. Category
5. Similar to values (Names of similar products)
REQ-42: A product shall have one or more plans which each plan have a unique identifier, name, list
of features, a price.
REQ-43: The seller shall add details of their product to connect with the application. For an example,
seller shall add webhook endpoint to receive events, and it should be tested before saving.
REQ-44: The system shall allow buyer to save the product or save and publish.
REQ-45: The system shall notify the administrator when a seller publishes a product. Administrator
must approve the product to publish and list on the website.
REQ-46: The system shall notify the seller when the product is approved or rejected.
3.2.4 Change/Edit Product
REQ-47: The system shall allow seller to edit the product details, add or remove plans.
8
SRS – AppStack – Flexaro Pvt Ltd.
REQ-48: The system shall allow seller to save the changes of the product as draft, without affecting
to the publish product.
REQ-49: The system shall notify and ask approval for publishing a changed product.
3.2.4 Delete Products
REQ-50: The system shall allow seller to un-list and delete a product.
REQ-51: The system shall notify and ask approval for deletion of a product.
REQ-52: The system shall not allow users to purchase new subscription during pending deletion
and shall not be listed in the public catalog.
REQ-53: The system shall provide refunds for current month upon deletion.
3.2.4 View Products Lists on Seller Dashboard
REQ-54: The system shall show a list of products, with their status (Drat, published, etc.) in the
seller dashboard.
REQ-55: The system shall allow sellers to see active and canceled subscriptions for each product, in
the seller dashboard.
REQ-56: The system shall allow sellers to see a summary of subscription, views and cancellations on
the dashboard.
REQ-57: The system shall not show any PPI of the buyers in the seller dashboard.
3.2.4 View Seller’s Earning
REQ-58: The system shall show a list of transactions (Sales, Refunds, Payouts, Adjustments, etc.) in
the seller dashboard. These transactions should be paginated and filtered by state and date
range.
REQ-59: The system shall retain funds gain from sales up to x number of days as locked before
adding to seller’s wallet. (Usually 30 days). Seller shall not be able to withdraw funds during
that period.
REQ-60: The system shall move seller’s earnings to the wallet after x number of days.
REQ-61: The x in the above requirements, i.e. sales_fund_lock_period shall be able to configure by
administrators or the environment. It must have a default value of 30 days.
3.2.4 Request Payout for Earnings
REQ-62: The sellers shall be able to withdraw their funds from the wallet with more than a certain
minimum amount, from the seller dashboard.
REQ-63: The system shall record the payout request and notify administrators for the approval.
• Payout – Pending → Approved → Complete
• E.g. error paths – Pending → Rejected, Pending → Approved → Failed
REQ-62: The system shall allow administrators to view payout requests, history, filter/search history.
9
SRS – AppStack – Flexaro Pvt Ltd.
REQ-63: The system shall allow administrators to review payout requests and approve.
REQ-64: The system shall automatically proceed the payouts.
3.2.4 Scheduled Payments and Payouts
REQ-65: The system shall run a daily loop or multiple loops per day to proceed all payments, payouts
and refunds approved by administrators.
REQ-66: The system shall retry up-to three times for the payment collection, with a delay of n
number of days.
REQ-67: The system should notify relevant parties about transactions and transaction failures.
3.2.4 System integrations and Events
REQ-68: The system shall provide a managed API for sellers to integrate their application to the
platform via RESTful API and Webhooks.
REQ-69: The system shall pass events occurring during different process to the relevant product’s
webhook URL.
REQ-70: The system shall guarantee that the end system receives the message.
REQ-71: The system shall take events from the product via a RESTful endpoint.
REQ-72: The system shall provide a documentation for developers.
REQ-73: The system shall provide a sandbox environment for developers.
3.2.4 Administrator User Management:
REQ-74: The system shall allow administrator to list accounts and filter or search accounts.
REQ-75: The system shall allow administrator to add new user, change user roles.
REQ-76: The system shall allow administrator to reset user’s password.
REQ-77: The system shall allow administrator to edit details of the user accounts.
REQ-78: The system shall allow administrator to delete user accounts.
10
SRS – AppStack – Flexaro Pvt Ltd.
3.2 Non-Functional Requirements
3.2.1 Scalability & Performance
NRQ-1: The system shall be able to handle 10k – 30k users during peak time.
NRQ-2: The system shall be able to manage more than 100 products.
3.2.2 Search Engine Optimization
NRQ-3: All public pages shall be SEO Friendly and shall be able to set SEO tags.
NRQ-4: All public pages shall be able to connect with Google Meta Pixel.
3.2.3 Security Requirement
NRQ-5: The system shall not hold credit card details or bank details of users.
NRQ-6: The system shall not expose user’s PPI for other users or public.
NRQ-7: The system shall not expose private pages (Buyer’s dashboard, admin dashboard, or
seller’s dashboard)
NRQ-8: The system shall be proxied through Cloudflare to prevent Bot attacks.
NRQ-9: The system shall be protected all publicly exposed forms with ReCAPTCHA.
3.2.4 User Interface
NRQ-10: The public UI, dashboards shall be mobile responsive.
4. Other Requirements
4.1 4.1. Legal and Regulatory Requirements
4.1.1 4.1.1 Application should be compliance with GDPR
ORQ-1: The system shall record user consent of exchanging PPI (email) with the seller, for each
subscription.
ORQ-2: The system shall record consent and agreement with the seller for data protection.
