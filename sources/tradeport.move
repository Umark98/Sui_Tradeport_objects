#[allow(lint(share_owned), lint(self_transfer), duplicate_alias)]
module tradeport::tradeport {
    use std::string::{Self, String};
    use sui::display;
    use sui::kiosk::{Self, Kiosk, KioskOwnerCap};
    use sui::package::{Self, Publisher};
    use sui::transfer_policy::{
        Self as policy,
        TransferPolicy,
        TransferPolicyCap,
        TransferRequest
    };
    use sui::coin::Coin;
    use sui::sui::SUI;
    use std::option;
    use sui::tx_context::{Self, TxContext};
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use tradeport::royalty_rule;

    const EWrongVersion: u64 = 0;
    const EExceedsMintSupply: u64 = 2;
    const ENotAuthorized: u64 = 3;
    const VERSION: u64 = 1;

    // One-time witness for initializing the publisher
    public struct TRADEPORT has drop {}

    // Represents the NFT
    public struct Nft has key, store {
        id: UID,
        name: String,
        description: String,
        image_url: String,
        creator: address,
        mint_number: u64,
        rarity: String,
    }

    // Tracks NFT collection details and mint count
    public struct Collection has key, store {
        id: UID,
        version: u64,
        mint_supply: u64,
        minted: u64,
        creator: address,
    }

    // Initialize the module with Display
    fun init(otw: TRADEPORT, ctx: &mut TxContext) {
        let publisher = package::claim(otw, ctx);

        // Set up Display for Nft
        let mut display = display::new<Nft>(&publisher, ctx);
        display::add(&mut display, string::utf8(b"name"), string::utf8(b"{name} #{mint_number}"));
        display::add(&mut display, string::utf8(b"description"), string::utf8(b"{description}"));
        display::add(&mut display, string::utf8(b"image_url"), string::utf8(b"{image_url}"));
        display::add(&mut display, string::utf8(b"creator"), string::utf8(b"{creator}"));
        display::add(&mut display, string::utf8(b"rarity"), string::utf8(b"{rarity}"));
        display::update_version(&mut display);
        transfer::public_share_object(display);

        // Transfer publisher to sender
        transfer::public_transfer(publisher, tx_context::sender(ctx));
    }

public fun create_collection(
    publisher: &Publisher,
    mint_supply: u64,
    ctx: &mut TxContext
): (Collection, TransferPolicyCap<Nft>) {
    let collection = Collection {
        id: object::new(ctx),
        version: VERSION,
        mint_supply,
        minted: 0,
        creator: tx_context::sender(ctx),
    };
    let (policy, cap) = policy::new<Nft>(publisher, ctx);
    transfer::public_share_object(policy); // Share policy
    (collection, cap)
}

    // Create a kiosk for the sender
    public fun create_kiosk(ctx: &mut TxContext): (Kiosk, KioskOwnerCap) {
        kiosk::new(ctx)
    }

    // Add royalty rule to the TransferPolicy
    public fun add_royalty_rule(
        policy: &mut TransferPolicy<Nft>,
        cap: &TransferPolicyCap<Nft>,
        royalty_bp: u16,
        royalty_min_amount: u64,
        ctx: &mut TxContext
    ) {
        royalty_rule::add(policy, cap, royalty_bp, royalty_min_amount, ctx);
    }

    public fun mint_nft(
        collection: &mut Collection,
        kiosk: &mut Kiosk,
        cap: &KioskOwnerCap,
        name: String,
        description: String,
        image_url: String,
        rarity: String,
        ctx: &mut TxContext
    ) {
        assert!(collection.version == VERSION, EWrongVersion);
        assert!(collection.minted < collection.mint_supply, EExceedsMintSupply);
        assert!(collection.creator == tx_context::sender(ctx), ENotAuthorized);

        collection.minted = collection.minted + 1;
        let nft = Nft {
            id: object::new(ctx),
            name,
            description,
            image_url,
            creator: collection.creator,
            mint_number: collection.minted,
            rarity,
        };

        kiosk::place(kiosk, cap, nft);
    }

    // Complete a transfer with royalty enforcement
    public fun complete_transfer(
        policy: &mut TransferPolicy<Nft>,
        mut request: TransferRequest<Nft>,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ): (ID, u64, ID) {
        royalty_rule::pay(policy, &mut request, payment, ctx);
        policy::confirm_request(policy, request)
    }

    // Estimate royalty fee for a transfer
    public fun estimate_royalty_fee(policy: &TransferPolicy<Nft>, paid: u64): u64 {
        royalty_rule::fee_amount(policy, paid)
    }

    // Update the mint supply of a collection
    public fun update_mint_supply(
        collection: &mut Collection,
        new_supply: u64,
        ctx: &mut TxContext
    ) {
        assert!(collection.creator == tx_context::sender(ctx), ENotAuthorized);
        assert!(collection.minted <= new_supply, EExceedsMintSupply);
        collection.mint_supply = new_supply;
    }

    // Get the number of NFTs minted in a collection
    public fun get_minted_count(collection: &Collection): u64 {
        collection.minted
    }

    // Withdraw royalties from the TransferPolicy
    public fun withdraw_royalties(
        policy: &mut TransferPolicy<Nft>,
        cap: &TransferPolicyCap<Nft>,
        ctx: &mut TxContext
    ): Coin<SUI> {
        policy::withdraw(policy, cap, option::none(), ctx)
    }
}