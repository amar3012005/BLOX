module ticket_addr::ticket {
    use std::string::{Self, String};
    use std::signer;
    use aptos_framework::account;
    use aptos_framework::event;
    use aptos_token::token;

    struct TicketMinted has drop, store {
        receiver: address,
        metadata: string::String,
    }

    struct TicketEvents has key {
        mint_events: event::EventHandle<TicketMinted>,
    }

    fun init_module(account: &signer) {
        move_to(account, TicketEvents {
            mint_events: account::new_event_handle<TicketMinted>(account),
        });
    }

    public entry fun mint_ticket(account: &signer, seat_number: u64) {
        let creator_addr = signer::address_of(account);
        
        // Initialize token store if needed
        if (!token::initialize_token_store(account)) {
            token::initialize_token_store(account);
        };

        // Convert number to string for token metadata
        let seat_id = string::utf8(b"SEAT-");
        string::append(&mut seat_id, num_to_string(seat_number));

        // Create collection if not exists
        if (!token::check_collection_exists(creator_addr, string::utf8(b"Movie Tickets"))) {
            token::create_collection(
                account,
                string::utf8(b"Movie Tickets"),
                string::utf8(b"Movie Tickets Collection"),
                string::utf8(b"https://aptos.dev"),
                0,
                vector<bool>[false, false, false]
            );
        };

        // Create token with number-based ID
        let token_data_id = token::create_tokendata(
            account,
            string::utf8(b"Movie Tickets"),
            seat_id,
            string::utf8(b"Dune Movie Ticket NFT"),
            1,
            // Use IPFS or your hosted image URL
            string::utf8(b"https://ipfs.io/ipfs/QmYourIPFSHash"), // Update this with actual image URI
            creator_addr,
            1,
            0,
            token::create_token_mutability_config(
                &vector<bool>[false, false, false, false, true]
            ),
            // Add property keys for metadata
            vector<String>[
                string::utf8(b"seat_number")
            ],
            // Add property values
            vector<vector<u8>>[
                bcs::to_bytes(&seat_number)
            ],
            // Add property types
            vector<String>[
                string::utf8(b"u64")
            ]
        );

        // Mint token
        token::mint_token(account, token_data_id, 1);

        // Emit event
        if (exists<TicketEvents>(creator_addr)) {
            let events = borrow_global_mut<TicketEvents>(creator_addr);
            event::emit_event(&mut events.mint_events, TicketMinted {
                receiver: creator_addr,
                metadata: seat_id
            });
        };
    }

    // Helper function to convert number to string
    fun num_to_string(num: u64): String {
        if (num == 0) {
            return string::utf8(b"0")
        };
        let buffer = vector::empty<u8>();
        while (num > 0) {
            let digit = ((num % 10) as u8) + 48;
            vector::push_back(&mut buffer, digit);
            num = num / 10;
        };
        vector::reverse(&mut buffer);
        string::utf8(buffer)
    }
}