#[allow(lint(share_owned), lint(self_transfer), duplicate_alias)]
module tradeport::royalty_rule {
    use sui::transfer_policy::{
        Self as policy,
        TransferPolicy,
        TransferPolicyCap,
        TransferRequest
    };
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;

    const EInvalidRoyalty: u64 = 1;

    public struct Rule has drop {}

public struct RoyaltyConfig has store, drop { 
        basis_points: u16,
        min_amount: u64,
        recipient: address,
    }

    public struct RuleConfig has store, drop {
        config: RoyaltyConfig
    }
    public fun add<T>(
        policy: &mut TransferPolicy<T>,
        cap: &TransferPolicyCap<T>,
        basis_points: u16,
        min_amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(basis_points <= 10000, EInvalidRoyalty);
        let config = RoyaltyConfig {
            // id: object::new(ctx),
            basis_points,
            min_amount,
            recipient: tx_context::sender(ctx),
        };
        let rule_config = RuleConfig { config };
        policy::add_rule(Rule {}, policy, cap, rule_config);
    }

    public fun fee_amount<T>(policy: &TransferPolicy<T>, paid: u64): u64 {
        let rule_config: &RuleConfig = policy::get_rule(Rule {}, policy);
        let config = &rule_config.config;
        let fee = (paid * (config.basis_points as u64)) / 10000;
        if (fee < config.min_amount) {
            config.min_amount
        } else {
            fee
        }
    }

    public fun pay<T>(
        policy: &mut TransferPolicy<T>,
        request: &mut TransferRequest<T>,
        mut payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let rule_config: &RuleConfig = policy::get_rule(Rule {}, policy);
        let config = &rule_config.config;
        let paid = coin::value(&payment);
        let fee = fee_amount(policy, paid);

        assert!(paid >= fee, EInvalidRoyalty);

        let royalty = coin::split(&mut payment, fee, ctx);
        transfer::public_transfer(royalty, config.recipient);

        if (coin::value(&payment) > 0) {
            transfer::public_transfer(payment, tx_context::sender(ctx));
        } else {
            coin::destroy_zero(payment);
        };

        policy::add_receipt(Rule {}, request);
    }
}