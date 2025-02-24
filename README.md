# Blockchain-Based Event Ticketing System
This is the submission of team CypherBlox { Amar Sai and Shalom Ladalla } for KrackHack'25.

## Problem Statement:

Event ticket fraud, scalping, and opaque resale markets lead to significant financial losses and frustration for both event organizers and attendees. Centralized ticketing platforms often fail to ensure ticket authenticity or enforce fair pricing, allowing scalpers to exploit attendees with exorbitant markups and counterfeit tickets. The challenge is to develop a blockchain-powered ticketing solution, preferably a web application interacting with smart contracts on a test network, where each ticket is minted as a unique NFT to prevent duplication and provide verifiable ownership. The system must include a secondary marketplace with enforced price controls and royalties on every resale, ensuring organizers receive a percentage while preventing exploitative pricing and maintaining authenticity.

## Solving the Problem.
The web-app has been deployed at: https://ubiquitous-sable-24fd41.netlify.app
Our development process began with the creation of a user-friendly front-end system built using react.js, designed to provide a seamless experience for users to browse and book event tickets. The interface allows users to navigate through available shows, select their preferred seats, and proceed to the payment portal.

Once the desired seats are selected, the system directs users to a secure payment gateway. Here, payments are processed in fiat currency through the Petra Wallet, which seamlessly converts the fiat amount into blockchain-based tokens. This integration ensures a smooth transition between traditional payment methods and blockchain technology, making the process accessible to both crypto-savvy and non-crypto users.

Upon successful payment approval, a unique NFT artwork is automatically generated. This NFT serves as the digital event pass or ticket, embedding essential details such as:

Seat/Zone Number: Specifies the exact location of the ticket holder within the venue.

Owner Details: Contains the ticket holder’s information for verification purposes.

Maximum Markup Value: Ensures fair pricing by capping the resale value of the ticket.

Additionally, the NFT includes a QR code for quick and secure authorization at the event venue. This QR code acts as a digital key, enabling event staff to verify ticket authenticity and grant entry efficiently.

By combining blockchain technology with a user-centric design, our system not only enhances security and transparency but also provides a modern and convenient ticketing solution for both event organizers and attendees.

![image](https://github.com/user-attachments/assets/bf1d2f01-52d4-47f7-8329-e8d035f1d345)

How is the NFT Artwork Generated?
- The NFT artwork is procedurally generated on a 50 x 120 pixel grid, ensuring each ticket is unique. The grid is populated using the random.randint() function, called 400 times to assign randomized numerical values to each cell. These values are then mapped to a curated palette of blue hues, ranging from light pastels to deep shades, creating a harmonious and visually distinct pattern.

This generative approach guarantees that no two artworks are identical, while maintaining a cohesive blue-themed aesthetic. The result is a unique digital collectible that doubles as a functional event ticket, combining creativity with blockchain-based utility.
##

Upon successful ticket booking, a unique digital artwork is generated and tokenized as an NFT using Move Contracts on the blockchain. This NFT serves as the digital representation of the event ticket and includes a unique NFT hash, which is used for secure access verification at the event entry point. The hash ensures that only valid ticket holders can gain entry, enhancing security and preventing fraud.

Once the ticket is booked, users can conveniently view all their purchased tickets in the "My Tickets" section of the platform. This section provides a comprehensive overview of their event passes, including details such as seat/zone number, event information, and ownership status.

Additionally, users have the option to resell their tickets on the integrated marketplace. The resale process is designed to ensure fairness and transparency:

Maximum Markup Price: The resale price is capped at a predefined maximum markup value, preventing exploitative pricing and ensuring affordability for buyers.

Royalty Mechanism: When a resale occurs, a royalty fee is automatically deducted and distributed to the event organizers. This ensures that organizers continue to benefit from secondary sales.

Profit Distribution: The remaining proceeds from the resale are transferred to the original ticket holder, providing them with a fair return on their investment.

This resale functionality not only empowers users to manage their tickets flexibly but also creates a self-sustaining ecosystem where organizers, buyers, and sellers all benefit from the transparent and secure nature of blockchain technology.

Verification of the Ticket/Pass:
- upon the arrival at the venue the NFT pass is scanned at entry, The QR code consists of the hash- in metadata, the security scans using the admin webpage which leads to official Aptos Explorer that consists of data required in the form of a payload that can be verified.

Additional Features added:
- Smart Bidding: Users can bid on premium seats, the process of bidding has a timer that increments the value of the bid by a certain percentage every 5secs until the bid is closed.
