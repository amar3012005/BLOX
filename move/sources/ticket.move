module ticket_addr::ticket {
    use std::string;
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

    public entry fun mint_ticket(account: &signer, metadata: string::String) {
        let receiver = signer::address_of(account);
        
        // Create token metadata
        let token_data_id = token::create_tokendata(
            account,
            string::utf8(b"Movie Ticket"),
            string::utf8(b"MT"),
            metadata,
            1, // maximum tokens
            string::utf8(b"https://your-metadata-uri.com"),
            receiver, // royalty payee address
            1, // royalty points denominator
            0, // royalty points numerator
            token::create_token_mutability_config(
                &vector<bool>[false, false, false, false, true]
            ),
            vector<string::String>[],
            vector<vector<u8>>[],
            vector<string::String>[]
        );

        // Mint token to receiver
        let token_id = token::mint_token(
            account,
            token_data_id,
            1 // amount
        );

        // Transfer token to receiver
        token::direct_transfer(account, receiver, token_id, 1);

        // Emit event
        if (exists<TicketEvents>(receiver)) {
            let events = borrow_global_mut<TicketEvents>(receiver);
            event::emit_event(&mut events.mint_events, TicketMinted {
                receiver,
                metadata
            });
        };
    }
}
