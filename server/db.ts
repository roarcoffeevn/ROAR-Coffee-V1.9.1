import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { ALL_ADMIN_PERMISSIONS, ADMIN_ROLE_PRESETS, hashPassword } from './auth.ts';
import { exportCmsSnapshotToDisk, restoreFromSnapshot } from './snapshot.ts';
import { buildFiveTierPrices, generateEan13Barcode } from '../src/lib/pricing.ts';
import {
  DEFAULT_CHECKIN_SCHEDULE,
  DEFAULT_GAME_CONFIGS,
  DEFAULT_GAME_REWARDS,
} from '../src/lib/gamesCatalog.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'roar_coffee.db');
export const db = new Database(DB_PATH);
// Flush any prior WAL frames cleanly and run in single-file DELETE mode so data/roar_coffee.db
// stays 100% self-contained when downloaded, zipped, or pushed to GitHub.
try {
  db.pragma('wal_checkpoint(TRUNCATE)');
} catch {
  // ignore
}
db.pragma('journal_mode = DELETE');
db.pragma('foreign_keys = ON');

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer', 'b2b_partner', 'admin')),
      member_code TEXT NOT NULL UNIQUE,
      tier TEXT NOT NULL DEFAULT 'ROAR Member',
      email_verified INTEGER NOT NULL DEFAULT 0,
      verification_token TEXT,
      reset_token TEXT,
      reset_expires INTEGER,
      addresses_json TEXT NOT NULL DEFAULT '[]',
      notification_prefs_json TEXT NOT NULL DEFAULT '{"email_orders":true,"email_offers":true,"zalo_updates":false}',
      privacy_prefs_json TEXT NOT NULL DEFAULT '{"marketing_consent":false,"analytics_consent":true}',
      deletion_requested INTEGER NOT NULL DEFAULT 0,
      company_name TEXT DEFAULT '',
      b2b_verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      sku TEXT NOT NULL UNIQUE,
      barcode TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL CHECK(category IN ('roasted', 'roasted_beans', 'green_bean', 'instant', 'pepper')),
      sub_category TEXT DEFAULT '',
      name_vi TEXT NOT NULL,
      name_en TEXT NOT NULL,
      subtitle_vi TEXT DEFAULT '',
      subtitle_en TEXT DEFAULT '',
      description_vi TEXT NOT NULL,
      description_en TEXT NOT NULL,
      coffee_type TEXT NOT NULL,
      blend_summary_vi TEXT DEFAULT '',
      blend_summary_en TEXT DEFAULT '',
      blend_public INTEGER NOT NULL DEFAULT 1,
      roast_profile_vi TEXT DEFAULT '',
      roast_profile_en TEXT DEFAULT '',
      tasting_notes_vi TEXT DEFAULT '',
      tasting_notes_en TEXT DEFAULT '',
      brewing_methods_json TEXT NOT NULL DEFAULT '[]',
      variants_json TEXT NOT NULL DEFAULT '[]',
      pricing_tiers_json TEXT NOT NULL DEFAULT '[]',
      packaging_options_json TEXT NOT NULL DEFAULT '[]',
      price_vnd INTEGER NOT NULL DEFAULT 0,
      price_usd REAL NOT NULL DEFAULT 0,
      inventory INTEGER NOT NULL DEFAULT 0,
      moq TEXT DEFAULT '1',
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'configurable_on_request', 'out_of_stock', 'draft')),
      is_demo_data INTEGER NOT NULL DEFAULT 1,
      mascot_slug TEXT DEFAULT '',
      screen_size TEXT DEFAULT '',
      processing_method TEXT DEFAULT '',
      origin_region TEXT DEFAULT '',
      harvest_year TEXT DEFAULT 'Pending verified lot',
      moisture_content TEXT DEFAULT 'Pending verified COA',
      density TEXT DEFAULT 'Pending verified COA',
      defect_info TEXT DEFAULT 'Pending verified COA',
      grading_spec TEXT DEFAULT 'TCVN / Export grade configurable',
      image_key TEXT NOT NULL DEFAULT 'product_robusta_house',
      gallery_images_json TEXT NOT NULL DEFAULT '[]',
      featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS product_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      author_name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT NOT NULL,
      verified_purchase INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'VND',
      subtotal INTEGER NOT NULL,
      discount_amount INTEGER NOT NULL DEFAULT 0,
      points_redeemed INTEGER NOT NULL DEFAULT 0,
      points_discount INTEGER NOT NULL DEFAULT 0,
      shipping_fee INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL,
      voucher_code TEXT DEFAULT '',
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'awaiting_payment',
      order_status TEXT NOT NULL DEFAULT 'Pending' CHECK(order_status IN ('Pending', 'Confirmed', 'Processing', 'Shipping', 'Completed', 'Cancelled', 'Returned')),
      tracking_code TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      require_invoice INTEGER NOT NULL DEFAULT 0,
      invoice_company_name TEXT DEFAULT '',
      invoice_tax_id TEXT DEFAULT '',
      invoice_company_address TEXT DEFAULT '',
      invoice_email TEXT DEFAULT '',
      points_awarded INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      sku TEXT NOT NULL,
      product_name_vi TEXT NOT NULL,
      product_name_en TEXT NOT NULL,
      variant_label TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price_vnd INTEGER NOT NULL,
      line_total_vnd INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS points_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
      entry_type TEXT NOT NULL CHECK(entry_type IN ('earn_pending', 'earn_available', 'redeem', 'reverse', 'expire', 'admin_adjustment')),
      points INTEGER NOT NULL,
      description_vi TEXT NOT NULL,
      description_en TEXT NOT NULL,
      expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS loyalty_settings (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      points_per_10k_vnd INTEGER NOT NULL DEFAULT 1,
      vnd_per_point INTEGER NOT NULL DEFAULT 100,
      expiration_days INTEGER NOT NULL DEFAULT 365,
      max_redeem_percent INTEGER NOT NULL DEFAULT 30,
      policy_status TEXT NOT NULL DEFAULT 'Proposed / Configurable Policy',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS membership_tiers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      min_spend_vnd INTEGER NOT NULL DEFAULT 0,
      point_multiplier REAL NOT NULL DEFAULT 1.0,
      qualification_months INTEGER NOT NULL DEFAULT 12,
      benefits_vi TEXT NOT NULL,
      benefits_en TEXT NOT NULL,
      early_access INTEGER NOT NULL DEFAULT 0,
      birthday_reward_code TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS promotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      title_vi TEXT NOT NULL,
      title_en TEXT NOT NULL,
      description_vi TEXT NOT NULL,
      description_en TEXT NOT NULL,
      promo_type TEXT NOT NULL,
      discount_type TEXT NOT NULL CHECK(discount_type IN ('percent', 'fixed', 'free_shipping')),
      discount_value INTEGER NOT NULL DEFAULT 0,
      max_discount INTEGER NOT NULL DEFAULT 0,
      min_order_value INTEGER NOT NULL DEFAULT 0,
      eligible_category TEXT NOT NULL DEFAULT 'all',
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      usage_limit INTEGER NOT NULL DEFAULT 1000,
      used_count INTEGER NOT NULL DEFAULT 0,
      per_customer_limit INTEGER NOT NULL DEFAULT 1,
      combinable INTEGER NOT NULL DEFAULT 0,
      member_only INTEGER NOT NULL DEFAULT 0,
      min_tier TEXT DEFAULT '',
      terms_vi TEXT NOT NULL,
      terms_en TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS b2b_inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inquiry_type TEXT NOT NULL CHECK(inquiry_type IN ('sample_request', 'green_quotation', 'wholesale_partner', 'horeca', 'oem_private_label', 'export_inquiry', 'corporate_gifting', 'contact')),
      company_name TEXT DEFAULT '',
      contact_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      country TEXT DEFAULT 'Vietnam',
      business_type TEXT DEFAULT '',
      product_sku TEXT DEFAULT '',
      packaging_option TEXT DEFAULT '',
      estimated_volume TEXT DEFAULT '',
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'reviewing', 'quoted', 'closed')),
      admin_notes TEXT DEFAULT '',
      quoted_price TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS coffee_origins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      region_name_vi TEXT NOT NULL,
      region_name_en TEXT NOT NULL,
      localities_vi TEXT NOT NULL,
      localities_en TEXT NOT NULL,
      elevation TEXT NOT NULL,
      varieties TEXT NOT NULL,
      processing_methods TEXT NOT NULL,
      sourcing_status TEXT NOT NULL CHECK(sourcing_status IN ('confirmed_sourcing', 'general_geography')),
      characteristics_vi TEXT NOT NULL,
      characteristics_en TEXT NOT NULL,
      sourcing_note_vi TEXT NOT NULL,
      sourcing_note_en TEXT NOT NULL,
      map_x REAL NOT NULL,
      map_y REAL NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      image_key TEXT NOT NULL,
      photo_attribution TEXT NOT NULL,
      related_skus_json TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS personalities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      animal_en TEXT NOT NULL,
      animal_vi TEXT NOT NULL,
      traits_vi TEXT NOT NULL,
      traits_en TEXT NOT NULL,
      story_vi TEXT NOT NULL,
      story_en TEXT NOT NULL,
      product_association_vi TEXT NOT NULL,
      product_association_en TEXT NOT NULL,
      associated_product_slug TEXT DEFAULT '',
      is_future_collection INTEGER NOT NULL DEFAULT 0,
      image_key TEXT NOT NULL,
      custom_image_url TEXT DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS journal_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      tags_json TEXT NOT NULL DEFAULT '[]',
      title_vi TEXT NOT NULL,
      title_en TEXT NOT NULL,
      excerpt_vi TEXT NOT NULL,
      excerpt_en TEXT NOT NULL,
      content_vi TEXT NOT NULL,
      content_en TEXT NOT NULL,
      author TEXT NOT NULL,
      read_minutes INTEGER NOT NULL DEFAULT 4,
      image_key TEXT NOT NULL,
      published INTEGER NOT NULL DEFAULT 1,
      published_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      lang TEXT NOT NULL DEFAULT 'vi',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS media_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL DEFAULT '',
      alt_text TEXT NOT NULL DEFAULT '',
      mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
      size_bytes INTEGER NOT NULL DEFAULT 0,
      source_type TEXT NOT NULL DEFAULT 'uploaded' CHECK(source_type IN ('uploaded', 'builtin')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title_vi TEXT NOT NULL,
      title_en TEXT NOT NULL,
      message_vi TEXT NOT NULL,
      message_en TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'system' CHECK(category IN ('order', 'promo', 'loyalty', 'system')),
      link_url TEXT DEFAULT '/account',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_user_id INTEGER,
      actor_email TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT DEFAULT '',
      details_json TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cms_pages (
      slug TEXT PRIMARY KEY,
      route_path TEXT NOT NULL,
      group_name TEXT NOT NULL DEFAULT 'story',
      eyebrow_vi TEXT NOT NULL DEFAULT '',
      eyebrow_en TEXT NOT NULL DEFAULT '',
      title_vi TEXT NOT NULL DEFAULT '',
      title_en TEXT NOT NULL DEFAULT '',
      subtitle_vi TEXT NOT NULL DEFAULT '',
      subtitle_en TEXT NOT NULL DEFAULT '',
      body_vi TEXT NOT NULL DEFAULT '',
      body_en TEXT NOT NULL DEFAULT '',
      hero_image_key TEXT NOT NULL DEFAULT '',
      cta_label_vi TEXT NOT NULL DEFAULT '',
      cta_label_en TEXT NOT NULL DEFAULT '',
      cta_url TEXT NOT NULL DEFAULT '',
      sections_json TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS game_configs (
      game_key TEXT PRIMARY KEY,
      title_vi TEXT NOT NULL,
      title_en TEXT NOT NULL,
      subtitle_vi TEXT NOT NULL DEFAULT '',
      subtitle_en TEXT NOT NULL DEFAULT '',
      daily_free_plays INTEGER NOT NULL DEFAULT 1,
      extra_play_cost_points INTEGER NOT NULL DEFAULT 30,
      min_score_to_win INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS game_rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_key TEXT NOT NULL,
      slot_order INTEGER NOT NULL DEFAULT 1,
      label_vi TEXT NOT NULL,
      label_en TEXT NOT NULL,
      description_vi TEXT NOT NULL DEFAULT '',
      description_en TEXT NOT NULL DEFAULT '',
      reward_type TEXT NOT NULL CHECK(reward_type IN ('points', 'voucher_percent', 'voucher_fixed', 'free_shipping', 'product_gift')),
      reward_value INTEGER NOT NULL DEFAULT 0,
      min_order_value INTEGER NOT NULL DEFAULT 0,
      max_discount INTEGER NOT NULL DEFAULT 0,
      gift_product_id INTEGER,
      gift_product_slug TEXT NOT NULL DEFAULT '',
      gift_product_name_vi TEXT NOT NULL DEFAULT '',
      gift_product_name_en TEXT NOT NULL DEFAULT '',
      gift_product_variant TEXT NOT NULL DEFAULT '',
      gift_image_key TEXT NOT NULL DEFAULT 'product_robusta_house',
      weight INTEGER NOT NULL DEFAULT 10,
      stock_total INTEGER NOT NULL DEFAULT -1,
      stock_remaining INTEGER NOT NULL DEFAULT -1,
      color_hex TEXT NOT NULL DEFAULT '#00552B',
      badge_vi TEXT NOT NULL DEFAULT '',
      badge_en TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS game_plays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      game_key TEXT NOT NULL,
      play_date TEXT NOT NULL,
      used_points INTEGER NOT NULL DEFAULT 0,
      score INTEGER NOT NULL DEFAULT 0,
      reward_id INTEGER,
      claim_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS game_reward_claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      game_key TEXT NOT NULL,
      reward_id INTEGER,
      claim_code TEXT NOT NULL UNIQUE,
      reward_type TEXT NOT NULL CHECK(reward_type IN ('points', 'voucher_percent', 'voucher_fixed', 'free_shipping', 'product_gift')),
      reward_label_vi TEXT NOT NULL,
      reward_label_en TEXT NOT NULL,
      reward_value INTEGER NOT NULL DEFAULT 0,
      promo_code TEXT NOT NULL DEFAULT '',
      gift_product_id INTEGER,
      gift_product_slug TEXT NOT NULL DEFAULT '',
      gift_product_name_vi TEXT NOT NULL DEFAULT '',
      gift_product_name_en TEXT NOT NULL DEFAULT '',
      gift_product_variant TEXT NOT NULL DEFAULT '',
      gift_image_key TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'redeemed', 'fulfilled', 'expired', 'cancelled')),
      redeemed_order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
      redeemed_at TEXT,
      expires_at TEXT NOT NULL,
      admin_note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_game_rewards_key ON game_rewards(game_key, slot_order);
    CREATE INDEX IF NOT EXISTS idx_game_plays_user_date ON game_plays(user_id, game_key, play_date);
    CREATE INDEX IF NOT EXISTS idx_game_claims_user ON game_reward_claims(user_id, status);

    CREATE TABLE IF NOT EXISTS cubeaway_profiles (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      avatar_badge TEXT NOT NULL DEFAULT 'lion',
      xp INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      coins INTEGER NOT NULL DEFAULT 120,
      current_level INTEGER NOT NULL DEFAULT 1,
      max_level INTEGER NOT NULL DEFAULT 1,
      total_score INTEGER NOT NULL DEFAULT 0,
      levels_cleared INTEGER NOT NULL DEFAULT 0,
      daily_cleared_count INTEGER NOT NULL DEFAULT 0,
      last_daily_date TEXT NOT NULL DEFAULT '',
      active_skin TEXT NOT NULL DEFAULT 'arcade',
      unlocked_skins_json TEXT NOT NULL DEFAULT '["arcade"]',
      active_backdrop TEXT NOT NULL DEFAULT 'indigo_studio',
      unlocked_backdrops_json TEXT NOT NULL DEFAULT '["indigo_studio"]',
      upgrades_json TEXT NOT NULL DEFAULT '{"radar":0,"thruster":0,"shield":0,"arsenal":0}',
      tool_hammer INTEGER NOT NULL DEFAULT 2,
      tool_shuffle INTEGER NOT NULL DEFAULT 2,
      tool_hint INTEGER NOT NULL DEFAULT 3,
      streak_days INTEGER NOT NULL DEFAULT 0,
      last_login_date TEXT NOT NULL DEFAULT '',
      streak_claimed_days_json TEXT NOT NULL DEFAULT '[]',
      event_cleared_stages_json TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cubeaway_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mode TEXT NOT NULL CHECK(mode IN ('campaign', 'daily', 'event')),
      stage_key TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      moves_used INTEGER NOT NULL DEFAULT 0,
      time_ms INTEGER NOT NULL DEFAULT 0,
      stars INTEGER NOT NULL DEFAULT 3,
      play_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cubeaway_friendships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_a INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_b INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_a, user_b)
    );

    CREATE TABLE IF NOT EXISTS cubeaway_friend_gifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      gift_date TEXT NOT NULL,
      coins_amount INTEGER NOT NULL DEFAULT 15,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(sender_id, receiver_id, gift_date)
    );

    CREATE INDEX IF NOT EXISTS idx_cubeaway_scores_mode_date ON cubeaway_scores(mode, play_date, score DESC);
    CREATE INDEX IF NOT EXISTS idx_cubeaway_profiles_score ON cubeaway_profiles(total_score DESC, max_level DESC);
    CREATE INDEX IF NOT EXISTS idx_cubeaway_friends_pair ON cubeaway_friendships(user_a, user_b, status);

    CREATE TABLE IF NOT EXISTS user_game_progress (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      game_key TEXT NOT NULL,
      current_level INTEGER NOT NULL DEFAULT 1,
      max_level INTEGER NOT NULL DEFAULT 1,
      best_score INTEGER NOT NULL DEFAULT 0,
      stars_json TEXT NOT NULL DEFAULT '{}',
      state_json TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, game_key)
    );

    CREATE TABLE IF NOT EXISTS saga_profiles (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      avatar_badge TEXT NOT NULL DEFAULT 'lion',
      coins INTEGER NOT NULL DEFAULT 180,
      current_level INTEGER NOT NULL DEFAULT 1,
      max_level INTEGER NOT NULL DEFAULT 1,
      total_score INTEGER NOT NULL DEFAULT 0,
      seasonal_score INTEGER NOT NULL DEFAULT 0,
      season_id TEXT NOT NULL DEFAULT 'SEASON_2026_1',
      active_skin TEXT NOT NULL DEFAULT 'barista_lion',
      unlocked_skins_json TEXT NOT NULL DEFAULT '["barista_lion"]',
      booster_hammer INTEGER NOT NULL DEFAULT 2,
      booster_switch8 INTEGER NOT NULL DEFAULT 2,
      booster_colorbomb INTEGER NOT NULL DEFAULT 1,
      booster_moves5 INTEGER NOT NULL DEFAULT 2,
      last_daily_gift_date TEXT NOT NULL DEFAULT '',
      daily_gift_streak INTEGER NOT NULL DEFAULT 0,
      stats_json TEXT NOT NULL DEFAULT '{"levelsCleared":0,"specialsTriggered":0,"pvpWins":0,"pvpPlayed":0}',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS saga_weekly_quests (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      week_key TEXT NOT NULL,
      quest_id TEXT NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      target INTEGER NOT NULL DEFAULT 1,
      claimed INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, week_key, quest_id)
    );

    CREATE TABLE IF NOT EXISTS guilds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      tag TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      emblem_color TEXT NOT NULL DEFAULT '#00552B',
      emblem_icon TEXT NOT NULL DEFAULT '🦁',
      leader_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      total_score INTEGER NOT NULL DEFAULT 0,
      member_count INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS guild_members (
      guild_id INTEGER NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('leader', 'officer', 'member')),
      contribution_score INTEGER NOT NULL DEFAULT 0,
      joined_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (guild_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS auction_listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      item_type TEXT NOT NULL CHECK(item_type IN ('booster_pack', 'skin_voucher', 'roar_box')),
      item_key TEXT NOT NULL,
      title_vi TEXT NOT NULL,
      title_en TEXT NOT NULL,
      starting_price INTEGER NOT NULL DEFAULT 50,
      current_bid INTEGER NOT NULL DEFAULT 50,
      highest_bidder_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      bid_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'settled', 'cancelled')),
      ends_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS auction_bids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL REFERENCES auction_listings(id) ON DELETE CASCADE,
      bidder_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      bid_amount INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS realtime_chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      display_name TEXT NOT NULL,
      avatar_badge TEXT NOT NULL DEFAULT 'lion',
      guild_tag TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS game_news_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_vi TEXT NOT NULL,
      title_en TEXT NOT NULL,
      summary_vi TEXT NOT NULL,
      summary_en TEXT NOT NULL,
      body_vi TEXT NOT NULL,
      body_en TEXT NOT NULL,
      tag TEXT NOT NULL DEFAULT 'event',
      pinned INTEGER NOT NULL DEFAULT 0,
      published_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      channel TEXT NOT NULL DEFAULT 'web' CHECK(channel IN ('web', 'zalo', 'email', 'hotline')),
      subject TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved')),
      priority TEXT NOT NULL DEFAULT 'normal',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS support_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
      sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      sender_role TEXT NOT NULL DEFAULT 'customer' CHECK(sender_role IN ('customer', 'agent')),
      sender_name TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_data_backups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      trigger_type TEXT NOT NULL DEFAULT 'auto' CHECK(trigger_type IN ('auto', 'manual')),
      summary_label TEXT NOT NULL DEFAULT '',
      snapshot_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pvp_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_code TEXT NOT NULL,
      player1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      player2_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      player1_score INTEGER NOT NULL DEFAULT 0,
      player2_score INTEGER NOT NULL DEFAULT 0,
      winner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      stake_coins INTEGER NOT NULL DEFAULT 25,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('waiting', 'active', 'finished')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      finished_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_saga_profiles_seasonal ON saga_profiles(seasonal_score DESC, max_level DESC);
    CREATE INDEX IF NOT EXISTS idx_chat_channel_id ON realtime_chat_messages(channel, id DESC);
    CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_backups_user ON user_data_backups(user_id, id DESC);
  `);

  ensureProductsSchemaUpgraded();
  restoreFromSnapshot(db);
  seedInitialData();
  runIncrementalMigrations();
  exportCmsSnapshotToDisk(db);
}

function ensureProductsSchemaUpgraded(): void {
  const tbl = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='products'").get() as { sql: string } | undefined;
  if (tbl && (!tbl.sql.includes("'roasted_beans'") || !tbl.sql.includes("'pepper'"))) {
    const existingCols = (db.prepare('PRAGMA table_info(products)').all() as Array<{ name: string }>).map((c) => c.name);
    const hasBarcode = existingCols.includes('barcode');
    const hasPricingTiers = existingCols.includes('pricing_tiers_json');
    const hasGallery = existingCols.includes('gallery_images_json');

    db.pragma('foreign_keys = OFF');
    const migrateTx = db.transaction(() => {
      db.exec(`
        CREATE TABLE products_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          slug TEXT NOT NULL UNIQUE,
          sku TEXT NOT NULL UNIQUE,
          barcode TEXT NOT NULL DEFAULT '',
          category TEXT NOT NULL CHECK(category IN ('roasted', 'roasted_beans', 'green_bean', 'instant', 'pepper')),
          sub_category TEXT DEFAULT '',
          name_vi TEXT NOT NULL,
          name_en TEXT NOT NULL,
          subtitle_vi TEXT DEFAULT '',
          subtitle_en TEXT DEFAULT '',
          description_vi TEXT NOT NULL,
          description_en TEXT NOT NULL,
          coffee_type TEXT NOT NULL,
          blend_summary_vi TEXT DEFAULT '',
          blend_summary_en TEXT DEFAULT '',
          blend_public INTEGER NOT NULL DEFAULT 1,
          roast_profile_vi TEXT DEFAULT '',
          roast_profile_en TEXT DEFAULT '',
          tasting_notes_vi TEXT DEFAULT '',
          tasting_notes_en TEXT DEFAULT '',
          brewing_methods_json TEXT NOT NULL DEFAULT '[]',
          variants_json TEXT NOT NULL DEFAULT '[]',
          pricing_tiers_json TEXT NOT NULL DEFAULT '[]',
          packaging_options_json TEXT NOT NULL DEFAULT '[]',
          price_vnd INTEGER NOT NULL DEFAULT 0,
          price_usd REAL NOT NULL DEFAULT 0,
          inventory INTEGER NOT NULL DEFAULT 0,
          moq TEXT DEFAULT '1',
          status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'configurable_on_request', 'out_of_stock', 'draft')),
          is_demo_data INTEGER NOT NULL DEFAULT 1,
          mascot_slug TEXT DEFAULT '',
          screen_size TEXT DEFAULT '',
          processing_method TEXT DEFAULT '',
          origin_region TEXT DEFAULT '',
          harvest_year TEXT DEFAULT 'Pending verified lot',
          moisture_content TEXT DEFAULT 'Pending verified COA',
          density TEXT DEFAULT 'Pending verified COA',
          defect_info TEXT DEFAULT 'Pending verified COA',
          grading_spec TEXT DEFAULT 'TCVN / Export grade configurable',
          image_key TEXT NOT NULL DEFAULT 'product_robusta_house',
          gallery_images_json TEXT NOT NULL DEFAULT '[]',
          featured INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        INSERT INTO products_new (
          id, slug, sku, barcode, category, sub_category, name_vi, name_en, subtitle_vi, subtitle_en,
          description_vi, description_en, coffee_type, blend_summary_vi, blend_summary_en, blend_public,
          roast_profile_vi, roast_profile_en, tasting_notes_vi, tasting_notes_en,
          brewing_methods_json, variants_json, pricing_tiers_json, packaging_options_json,
          price_vnd, price_usd, inventory, moq, status, is_demo_data,
          mascot_slug, screen_size, processing_method, origin_region,
          harvest_year, moisture_content, density, defect_info, grading_spec,
          image_key, gallery_images_json, featured, created_at
        )
        SELECT
          id, slug, sku, ${hasBarcode ? "COALESCE(barcode, '')" : "''"}, category, COALESCE(sub_category, ''),
          name_vi, name_en, COALESCE(subtitle_vi, ''), COALESCE(subtitle_en, ''),
          description_vi, description_en, coffee_type,
          COALESCE(blend_summary_vi, ''), COALESCE(blend_summary_en, ''), COALESCE(blend_public, 1),
          COALESCE(roast_profile_vi, ''), COALESCE(roast_profile_en, ''),
          COALESCE(tasting_notes_vi, ''), COALESCE(tasting_notes_en, ''),
          COALESCE(brewing_methods_json, '[]'), COALESCE(variants_json, '[]'),
          ${hasPricingTiers ? "COALESCE(pricing_tiers_json, '[]')" : "'[]'"},
          COALESCE(packaging_options_json, '[]'),
          COALESCE(price_vnd, 0), COALESCE(price_usd, 0), COALESCE(inventory, 0), COALESCE(moq, '1'),
          COALESCE(status, 'active'), COALESCE(is_demo_data, 1),
          COALESCE(mascot_slug, ''), COALESCE(screen_size, ''), COALESCE(processing_method, ''), COALESCE(origin_region, ''),
          COALESCE(harvest_year, 'Pending verified lot'), COALESCE(moisture_content, 'Pending verified COA'),
          COALESCE(density, 'Pending verified COA'), COALESCE(defect_info, 'Pending verified COA'),
          COALESCE(grading_spec, ''), COALESCE(image_key, 'product_robusta_house'),
          ${hasGallery ? "COALESCE(gallery_images_json, '[]')" : "'[]'"},
          COALESCE(featured, 0), COALESCE(created_at, datetime('now'))
        FROM products;

        DROP TABLE products;
        ALTER TABLE products_new RENAME TO products;
      `);
    });
    migrateTx();
    db.pragma('foreign_keys = ON');
    db.pragma('foreign_key_check');
  } else if (tbl) {
    const cols = (db.prepare('PRAGMA table_info(products)').all() as Array<{ name: string }>).map((c) => c.name);
    if (!cols.includes('barcode')) {
      db.exec("ALTER TABLE products ADD COLUMN barcode TEXT NOT NULL DEFAULT ''");
    }
    if (!cols.includes('pricing_tiers_json')) {
      db.exec("ALTER TABLE products ADD COLUMN pricing_tiers_json TEXT NOT NULL DEFAULT '[]'");
    }
    if (!cols.includes('gallery_images_json')) {
      db.exec("ALTER TABLE products ADD COLUMN gallery_images_json TEXT NOT NULL DEFAULT '[]'");
    }
  }
}

function seedInitialData(): void {
  const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (email, password_hash, full_name, phone, role, member_code, tier, email_verified, addresses_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertUser.run(
      'admin@roarcoffee.vn',
      hashPassword('RoarAdmin!2026'),
      'ROAR COFFEE Administrator',
      '+84 28 0000 0000',
      'admin',
      'RC-ADM-0001',
      'ROAR Reserve',
      1,
      JSON.stringify([])
    );
    insertUser.run(
      'member@roarcoffee.vn',
      hashPassword('RoarMember!2026'),
      'Nguyễn Minh Khôi',
      '0909 123 456',
      'customer',
      'RC-MEM-1001',
      'ROAR Silver',
      1,
      JSON.stringify([
        {
          id: 'addr-1',
          label: 'Văn phòng Quận 1',
          recipient: 'Nguyễn Minh Khôi',
          phone: '0909 123 456',
          addressLine: '12 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
          isDefault: true,
        },
      ])
    );
  }

  const loyaltyCount = (db.prepare('SELECT COUNT(*) as c FROM loyalty_settings').get() as { c: number }).c;
  if (loyaltyCount === 0) {
    db.prepare(`
      INSERT INTO loyalty_settings (id, points_per_10k_vnd, vnd_per_point, expiration_days, max_redeem_percent, policy_status)
      VALUES (1, 1, 100, 365, 30, 'Proposed / Configurable Policy')
    `).run();
  }

  const tierCount = (db.prepare('SELECT COUNT(*) as c FROM membership_tiers').get() as { c: number }).c;
  if (tierCount === 0) {
    const insertTier = db.prepare(`
      INSERT INTO membership_tiers (name, min_spend_vnd, point_multiplier, qualification_months, benefits_vi, benefits_en, early_access, birthday_reward_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertTier.run(
      'ROAR Member',
      0,
      1.0,
      12,
      'Tích điểm cơ bản theo chính sách đề xuất · Ưu đãi chào mừng thành viên mới',
      'Standard points earning under proposed rules · Welcome member voucher access',
      0,
      'ROARBDAY'
    );
    insertTier.run(
      'ROAR Silver',
      3000000,
      1.25,
      12,
      'Hệ số điểm 1.25x (cấu hình) · Voucher sinh nhật · Miễn phí giao hàng đơn từ ngưỡng quy định',
      '1.25x configurable point multiplier · Birthday reward · Priority seasonal offers',
      0,
      'ROARBDAY'
    );
    insertTier.run(
      'ROAR Gold',
      10000000,
      1.5,
      12,
      'Hệ số điểm 1.5x (cấu hình) · Tiếp cận sớm các lô rang mới · Sự kiện thử nếm thành viên',
      '1.5x configurable point multiplier · Early product access · Member cupping invitations',
      1,
      'ROARBDAY'
    );
    insertTier.run(
      'ROAR Reserve',
      25000000,
      2.0,
      12,
      'Hệ số điểm 2.0x (cấu hình) · Đặc quyền Signature Reserve · Tư vấn quà tặng doanh nghiệp riêng',
      '2.0x configurable point multiplier · Signature Reserve privileges · Dedicated gifting concierge',
      1,
      'ROARBDAY'
    );
  }

  const productCount = (db.prepare('SELECT COUNT(*) as c FROM products').get() as { c: number }).c;
  if (productCount === 0) {
    const insertProduct = db.prepare(`
      INSERT INTO products (
        slug, sku, category, sub_category, name_vi, name_en, subtitle_vi, subtitle_en,
        description_vi, description_en, coffee_type, blend_summary_vi, blend_summary_en, blend_public,
        roast_profile_vi, roast_profile_en, tasting_notes_vi, tasting_notes_en,
        brewing_methods_json, variants_json, packaging_options_json,
        price_vnd, price_usd, inventory, moq, status, is_demo_data,
        mascot_slug, screen_size, processing_method, origin_region,
        harvest_year, moisture_content, density, defect_info, grading_spec, image_key, featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 1. Roasted Coffee Lines (6 flagship products)
    insertProduct.run(
      'robusta-house-blend',
      'RC-RST-RHB',
      'roasted',
      'House Collection',
      'ROAR COFFEE ROBUSTA HOUSE BLEND',
      'ROAR COFFEE ROBUSTA HOUSE BLEND',
      '100% Robusta Việt Nam · Nguyên liệu nhân xanh CBU chọn lọc',
      '100% Vietnamese Robusta · Selected CBU green coffee ingredient',
      'Dòng cà phê rang xay 100% Robusta Việt Nam được thiết kế cho nhịp sống thưởng thức cà phê hằng ngày, sử dụng nguồn nhân xanh chế biến ướt CBU khi được chỉ định, phù hợp pha phin truyền thống và các phương pháp pha chế được khuyến nghị.',
      '100% Vietnamese Robusta roasted coffee crafted for daily coffee rituals, incorporating specified CBU washed green coffee ingredients and tailored for traditional Vietnamese phin and approved brewing methods.',
      '100% Robusta',
      '100% Robusta (Thành phần nhân xanh CBU theo quy chuẩn ROAR COFFEE)',
      '100% Robusta (CBU washed green coffee component where specified)',
      1,
      'Rang vừa – đậm (Cấu hình theo lô rang xác thực)',
      'Medium-Dark Roast (Per verified roast profile)',
      'Hồ sơ hương vị đang chờ cập nhật từ kết quả thử nếm chính thức',
      'Verified cupping notes pending official sensory sign-off',
      JSON.stringify(['Vietnamese Phin', 'Espresso', 'Moka Pot']),
      JSON.stringify([
        { label: '250g · Whole Bean', priceVnd: 185000, priceUsd: 7.5 },
        { label: '250g · Phin Ground', priceVnd: 185000, priceUsd: 7.5 },
        { label: '500g · Whole Bean', priceVnd: 350000, priceUsd: 14.0 },
        { label: '1kg · HORECA Pack', priceVnd: 660000, priceUsd: 26.5 },
      ]),
      JSON.stringify(['250g', '500g', '1kg']),
      185000,
      7.5,
      120,
      '1 bag (Demo)',
      'active',
      1,
      'tiger',
      'S16/S18',
      'CBU / Washed',
      'Tây Nguyên (Đắk Lắk)',
      'Pending verified lot',
      'N/A (Roasted)',
      'N/A (Roasted)',
      'Roasted spec configurable',
      'ROAR Roasted Standard',
      'product_robusta_house',
      1
    );

    insertProduct.run(
      'arabica-selection',
      'RC-RST-ARS',
      'roasted',
      'Specialty Selection',
      'ROAR COFFEE ARABICA SELECTION',
      'ROAR COFFEE ARABICA SELECTION',
      '100% Arabica tuyển chọn · Nguyên liệu nhân xanh CBU',
      '100% Selected Arabica · CBU green coffee ingredient',
      'Dòng cà phê 100% Arabica tuyển chọn với nguyên liệu nhân xanh CBU khi được chỉ định, mang đến trải nghiệm tinh tế cho pha giấy lọc Pour-over và Espresso theo cấu hình rang chuẩn.',
      '100% selected Arabica coffee utilizing CBU green coffee ingredients where specified, delivering a refined coffee experience suited for filter pour-over and espresso according to the final roast profile.',
      '100% Arabica',
      '100% Arabica (Nhân xanh chế biến ướt CBU theo lô xác thực)',
      '100% Arabica (CBU washed green coffee component where specified)',
      1,
      'Rang vừa (Medium Roast)',
      'Medium Roast (Configurable per final profile)',
      'Hồ sơ hương vị đang chờ xác nhận từ đội ngũ thử nếm',
      'Tasting notes awaiting verified cupping panel approval',
      JSON.stringify(['Pour-over', 'Espresso', 'French Press', 'Cold Brew']),
      JSON.stringify([
        { label: '250g · Whole Bean', priceVnd: 265000, priceUsd: 10.8 },
        { label: '250g · Filter Ground', priceVnd: 265000, priceUsd: 10.8 },
        { label: '500g · Whole Bean', priceVnd: 510000, priceUsd: 20.5 },
        { label: '1kg · Barista Pack', priceVnd: 980000, priceUsd: 39.0 },
      ]),
      JSON.stringify(['250g', '500g', '1kg']),
      265000,
      10.8,
      85,
      '1 bag (Demo)',
      'active',
      1,
      'fox',
      'S16/S18',
      'CBU / Washed',
      'Lâm Đồng (Cầu Đất)',
      'Pending verified lot',
      'N/A (Roasted)',
      'N/A (Roasted)',
      'Roasted spec configurable',
      'ROAR Roasted Standard',
      'product_arabica_selection',
      1
    );

    insertProduct.run(
      'signature-reserve',
      'RC-RST-SGR',
      'roasted',
      'Reserve Luxury',
      'ROAR COFFEE SIGNATURE RESERVE',
      'ROAR COFFEE SIGNATURE RESERVE',
      '60% Robusta · 20% Culi · 20% Arabica · Linh vật Báo Đen',
      '60% Robusta · 20% Culi · 20% Arabica · Black Panther Edition',
      'Phiên bản cao cấp mang biểu tượng Báo Đen — Quý hiếm, bí ẩn, tinh tế và khác biệt. Công thức phối trộn đã được phê duyệt gồm 60% Robusta, 20% Culi và 20% Arabica sử dụng nguyên liệu nhân xanh CBU theo tiêu chuẩn riêng, hoàn hảo làm quà tặng sang trọng.',
      'Our flagship luxury edition embodied by the Black Panther — Exclusive, mysterious, sophisticated, and distinct. Approved composition of 60% Robusta, 20% Culi, and 20% Arabica with specified CBU green coffee ingredients, presented in obsidian black and champagne gold.',
      '60% Robusta · 20% Culi · 20% Arabica',
      '60% Robusta · 20% Culi · 20% Arabica (Nhân xanh CBU theo chỉ định)',
      '60% Robusta · 20% Culi · 20% Arabica (CBU green coffee ingredients as specified)',
      1,
      'Rang tinh chỉnh Signature Reserve',
      'Signature Reserve Precision Roast',
      'Hương vị phức hợp cân bằng · Chi tiết thử nếm chính thức cập nhật theo lô phát hành',
      'Structured luxury profile · Verified sensory notes published per lot release',
      JSON.stringify(['Espresso', 'Vietnamese Phin', 'Pour-over']),
      JSON.stringify([
        { label: '250g · Signature Tin (Whole Bean)', priceVnd: 490000, priceUsd: 20.0 },
        { label: '500g · Obsidian Gift Box', priceVnd: 920000, priceUsd: 37.5 },
        { label: 'Corporate Gift Set (2 x 250g)', priceVnd: 1150000, priceUsd: 46.5 },
      ]),
      JSON.stringify(['250g Tin', '500g Box', 'Corporate Gift Set']),
      490000,
      20.0,
      48,
      '1 tin (Demo)',
      'active',
      1,
      'black-panther',
      'S18 Selected',
      'CBU / Washed Reserve',
      'Tây Nguyên (Đắk Lắk & Lâm Đồng)',
      'Pending verified lot',
      'N/A (Roasted)',
      'N/A (Roasted)',
      'Reserve Lot Spec',
      'Signature Reserve Standard',
      'product_signature_reserve',
      1
    );

    insertProduct.run(
      'roar-dam-bold',
      'RC-RST-DAM',
      'roasted',
      'Personality Line',
      'ROAR COFFEE ĐẬM',
      'ROAR COFFEE ĐẬM (BOLD EDITION)',
      'Cá tính Hổ · Mạnh mẽ, quyết đoán, bản lĩnh',
      'Tiger Character · Boldness, Strength, Determination',
      'Sản phẩm gắn liền với linh vật Hổ trong bộ sưu tập 7 Cá Tính, dành cho người yêu phong cách cà phê mạnh mẽ, quyết đoán và đậm bản lĩnh. Tỷ lệ phối trộn nội bộ được bảo mật theo quy định thương hiệu.',
      'Associated with the Tiger character in the Seven Personalities collection, crafted for coffee drinkers who value boldness, strength, and determination. Confidential blend proportions are protected unless approved for disclosure.',
      'Proprietary Blend',
      'Công thức phối trộn bảo mật (Tỷ lệ chi tiết chỉ công bố khi được phê duyệt)',
      'Confidential blend formulation (Exact percentages withheld per brand policy)',
      0,
      'Rang đậm (Dark Roast)',
      'Dark Roast',
      'Hồ sơ hương vị đang chờ xác nhận công bố chính thức',
      'Verified tasting notes pending publication approval',
      JSON.stringify(['Vietnamese Phin', 'Iced Milk Coffee']),
      JSON.stringify([
        { label: '250g · Whole Bean', priceVnd: 195000, priceUsd: 7.9 },
        { label: '250g · Phin Ground', priceVnd: 195000, priceUsd: 7.9 },
        { label: '500g · Phin Ground', priceVnd: 370000, priceUsd: 15.0 },
      ]),
      JSON.stringify(['250g', '500g']),
      195000,
      7.9,
      90,
      '1 bag (Demo)',
      'active',
      1,
      'tiger',
      'S16/S18',
      'Configurable',
      'Tây Nguyên',
      'Pending verified lot',
      'N/A (Roasted)',
      'N/A (Roasted)',
      'Confidential',
      'ROAR Roasted Standard',
      'product_robusta_house',
      0
    );

    insertProduct.run(
      'roar-phin-heritage',
      'RC-RST-PHN',
      'roasted',
      'Personality Line',
      'ROAR COFFEE PHIN',
      'ROAR COFFEE PHIN',
      'Cá tính Sư Tử · Lãnh đạo, tự tin, uy nghi',
      'Lion Character · Leadership, Confidence, Authority',
      'Dòng cà phê tôn vinh văn hóa pha phin Việt Nam gắn với hình tượng Sư Tử — biểu trưng cho sự tự tin, uy nghi và tinh thần dẫn dắt.',
      'Honoring authentic Vietnamese phin coffee culture through the Lion character — symbolizing leadership, confidence, and quiet authority.',
      'Proprietary Phin Blend',
      'Công thức phối trộn dành riêng cho pha Phin (Bảo mật tỷ lệ)',
      'Proprietary Phin formulation (Confidential blend ratio)',
      0,
      'Rang chuẩn pha Phin',
      'Phin Traditional Roast',
      'Cấu trúc dày dặn cho pha phin · Chờ cập nhật ghi chú thử nếm xác thực',
      'Structured for slow phin extraction · Verified sensory notes pending',
      JSON.stringify(['Vietnamese Phin']),
      JSON.stringify([
        { label: '250g · Phin Ground', priceVnd: 210000, priceUsd: 8.5 },
        { label: '500g · Phin Ground', priceVnd: 395000, priceUsd: 16.0 },
      ]),
      JSON.stringify(['250g', '500g']),
      210000,
      8.5,
      75,
      '1 bag (Demo)',
      'active',
      1,
      'lion',
      'S16/S18',
      'Configurable',
      'Tây Nguyên',
      'Pending verified lot',
      'N/A (Roasted)',
      'N/A (Roasted)',
      'Confidential',
      'ROAR Roasted Standard',
      'product_robusta_house',
      0
    );

    insertProduct.run(
      'roar-espresso',
      'RC-RST-ESP',
      'roasted',
      'Personality Line',
      'ROAR COFFEE ESPRESSO',
      'ROAR COFFEE ESPRESSO',
      'Cá tính Cáo (Fox) · Thông minh, linh hoạt, sáng tạo',
      'Fox Character · Intelligence, Agility, Creativity',
      'Dòng cà phê rang xay chuyên biệt cho máy pha Espresso hiện đại và pha phin tinh chỉnh, gắn với hình tượng Cáo — biểu trưng cho tư duy linh hoạt, sự chính xác và sáng tạo mỗi ngày.',
      'Dedicated roasted blend engineered for modern espresso bars and agile daily extraction, embodied by the Fox — representing sharp intellect, agility, and creative craft.',
      'Proprietary Espresso Blend',
      'Công thức phối trộn Espresso chuẩn cân bằng (Tỷ lệ chi tiết bảo mật)',
      'Balanced Espresso formulation (Confidential blend percentages)',
      0,
      'Rang Espresso vừa-đậm (Medium-Dark Espresso)',
      'Medium-Dark Espresso Roast',
      'Crema ổn định, cân bằng cho Espresso 18g → 36g · Ghi chú hương vị cập nhật theo lô xác thực',
      'Stable crema balanced for 18g → 36g extraction · Verified cupping notes per batch',
      JSON.stringify(['Espresso', 'Moka Pot', 'Cold Brew']),
      JSON.stringify([
        { label: '250g · Whole Bean', priceVnd: 195000, priceUsd: 7.9 },
        { label: '250g · Espresso Fine Ground', priceVnd: 195000, priceUsd: 7.9 },
        { label: '500g · Whole Bean', priceVnd: 380000, priceUsd: 15.5 },
        { label: '1kg · Barista Pack', priceVnd: 720000, priceUsd: 29.0 },
      ]),
      JSON.stringify(['250g', '500g', '1kg']),
      195000,
      7.9,
      88,
      '1 bag (Demo)',
      'active',
      1,
      'fox',
      'S16/S18',
      'Configurable',
      'Tây Nguyên (Đắk Lắk & Lâm Đồng)',
      'Pending verified lot',
      'N/A (Roasted)',
      'N/A (Roasted)',
      'Confidential',
      'ROAR Espresso Standard',
      'product_arabica_selection',
      1
    );

    insertProduct.run(
      'roar-espresso-gold',
      'RC-RST-ESG',
      'roasted',
      'Personality Line',
      'ROAR COFFEE ESPRESSO GOLD',
      'ROAR COFFEE ESPRESSO GOLD',
      'Cá tính Đại Bàng (Eagle) · Tầm nhìn, tham vọng, bứt phá',
      'Eagle Character · Vision, Ambition, Excellence',
      'Phiên bản Espresso Gold cao cấp gắn với hình tượng Đại Bàng — đại diện cho khát vọng bứt phá và tiêu chuẩn chiết xuất khắt khe tại các quầy pha chế chuyên nghiệp và chuỗi HORECA.',
      'Elevated Espresso Gold edition anchored by the Eagle character — celebrating international vision, elevated hospitality standards, and high-clarity espresso extraction.',
      'Premium Espresso Gold Blend',
      'Công thức Espresso Gold tuyển chọn (Tỷ lệ chi tiết bảo mật)',
      'Selected Espresso Gold formulation (Confidential proportions)',
      0,
      'Rang Espresso Gold tinh chỉnh',
      'Precision Espresso Gold Roast',
      'Chiết xuất dày mượt 18g → 36g ở 90–94°C · Cập nhật thử nếm theo từng lô phát hành',
      'Dense, velvety 18g → 36g extraction at 90–94°C · Cupping notes updated per verified lot',
      JSON.stringify(['Espresso', 'Moka Pot']),
      JSON.stringify([
        { label: '250g · Whole Bean (Gold)', priceVnd: 235000, priceUsd: 9.5 },
        { label: '500g · Whole Bean (Gold)', priceVnd: 440000, priceUsd: 17.8 },
        { label: '1kg · HORECA Gold Pack', priceVnd: 840000, priceUsd: 34.0 },
      ]),
      JSON.stringify(['250g', '500g', '1kg']),
      235000,
      9.5,
      64,
      '1 bag (Demo)',
      'active',
      1,
      'eagle',
      'S18 Selected',
      'CBU / Washed & Honey',
      'Lâm Đồng & Đắk Lắk',
      'Pending verified lot',
      'N/A (Roasted)',
      'N/A (Roasted)',
      'Confidential',
      'ROAR Espresso Gold Standard',
      'hero_signature_reserve_banner',
      1
    );

    // 2. Instant Coffee Collections (Silver & Gold)
    insertProduct.run(
      'instant-silver-collection',
      'RC-INS-SLV',
      'instant',
      'Instant Collection',
      'ROAR COFFEE HÒA TAN — BỘ SƯU TẬP SILVER',
      'ROAR COFFEE INSTANT — SILVER COLLECTION',
      'Sắc xanh rừng đặc trưng kết hợp điểm nhấn ánh bạc tinh gọn',
      'Signature forest green identity with brushed silver accents',
      'Bộ sưu tập cà phê hòa tan Silver trong bao bì hộp ngang thanh lịch, giữ trọn bản sắc xanh rừng của ROAR COFFEE cùng tiện ích pha chế nhanh mọi lúc mọi nơi. Thông số công thức và định lượng chi tiết hiển thị theo hồ sơ xác nhận.',
      'The Instant Silver Collection in an architectural horizontal box pairing ROAR COFFEE forest green with silver accents. Exact formulation, stick count, and net weight fields are configurable pending final commercial specification.',
      'Instant Coffee Blend',
      'Công thức hòa tan Silver (Cập nhật theo hồ sơ công bố sản phẩm)',
      'Silver instant formulation (Pending final verified product sheet)',
      0,
      'Phun sấy / Hòa tan',
      'Instant Soluble Process',
      'Tiện lợi hằng ngày · Định lượng theo quy cách hộp',
      'Everyday convenience · Specifications per confirmed packaging run',
      JSON.stringify(['Hot Water (70–80°C)', 'Iced Coffee']),
      JSON.stringify([
        { label: 'Box 10 Sticks (Configurable Spec)', priceVnd: 95000, priceUsd: 3.9 },
        { label: 'Box 20 Sticks (Configurable Spec)', priceVnd: 175000, priceUsd: 7.2 },
      ]),
      JSON.stringify(['10 Sticks Box', '20 Sticks Box']),
      95000,
      3.9,
      140,
      '1 box (Demo)',
      'active',
      1,
      'fox',
      'N/A',
      'Soluble Instant',
      'Việt Nam',
      'Pending verified batch',
      '≤ 4.0% (Configurable)',
      'N/A',
      'Pending confirmed sheet',
      'Net weight & ingredients pending final label confirmation',
      '/assets/instant/instant-silver.jpg',
      1
    );

    insertProduct.run(
      'instant-gold-collection',
      'RC-INS-GLD',
      'instant',
      'Instant Collection',
      'ROAR COFFEE HÒA TAN — BỘ SƯU TẬP GOLD',
      'ROAR COFFEE INSTANT — GOLD COLLECTION',
      'Sắc xanh rừng sang trọng kết hợp ánh vàng Champagne Gold',
      'Forest green packaging accented with champagne gold metallic detailing',
      'Bộ sưu tập cà phê hòa tan Gold cao cấp với thiết kế hộp ngang sang trọng, hướng đến trải nghiệm đậm đà tinh tế cho doanh nhân, văn phòng và quà tặng.',
      'The premium Instant Gold Collection combining ROAR COFFEE forest green with champagne gold foil aesthetics for discerning daily rituals, hospitality rooms, and gifting.',
      'Premium Instant Coffee',
      'Công thức hòa tan Gold (Cập nhật theo hồ sơ công bố chính thức)',
      'Gold instant formulation (Pending final verified product sheet)',
      0,
      'Hòa tan cao cấp',
      'Premium Soluble Process',
      'Hồ sơ hương vị đang chờ cập nhật từ bản công bố chính thức',
      'Sensory details awaiting confirmed production specification',
      JSON.stringify(['Hot Water (70–80°C)', 'Iced Coffee']),
      JSON.stringify([
        { label: 'Gold Box 10 Sticks (Configurable Spec)', priceVnd: 135000, priceUsd: 5.5 },
        { label: 'Gold Box 20 Sticks (Configurable Spec)', priceVnd: 245000, priceUsd: 9.9 },
      ]),
      JSON.stringify(['10 Sticks Gold Box', '20 Sticks Gold Box']),
      135000,
      5.5,
      110,
      '1 box (Demo)',
      'active',
      1,
      'eagle',
      'N/A',
      'Soluble Instant',
      'Việt Nam',
      'Pending verified batch',
      '≤ 4.0% (Configurable)',
      'N/A',
      'Pending confirmed sheet',
      'Net weight & ingredients pending final label confirmation',
      '/assets/instant/instant-gold.jpg',
      1
    );

    // 3. Full 27-Combination Green Coffee Matrix (3 species/morphology x 3 screens x 3 processes)
    const types = [
      { code: 'RO', nameEn: 'Robusta', nameVi: 'Robusta', origin: 'Đắk Lắk / Gia Lai / Đắk Nông', baseVnd: 115000, baseUsd: 4.6 },
      { code: 'AR', nameEn: 'Arabica', nameVi: 'Arabica', origin: 'Lâm Đồng (Cầu Đất / Đà Lạt) / Sơn La', baseVnd: 185000, baseUsd: 7.4 },
      { code: 'CU', nameEn: 'Culi / Peaberry', nameVi: 'Culi / Peaberry', origin: 'Tây Nguyên (Chọn lọc hạt tròn)', baseVnd: 145000, baseUsd: 5.8 },
    ];
    const screens = ['S14', 'S16', 'S18'];
    const processes = [
      { code: 'NAT', nameEn: 'Natural Process', nameVi: 'Chế biến khô (Natural)' },
      { code: 'HON', nameEn: 'Honey Process', nameVi: 'Chế biến Honey' },
      { code: 'CBU', nameEn: 'Washed Process (CBU)', nameVi: 'Chế biến ướt (CBU)' },
    ];

    for (const t of types) {
      for (const s of screens) {
        for (const p of processes) {
          const sku = `${t.code}-${s}-${p.code}`;
          const slug = `green-${t.code.toLowerCase()}-${s.toLowerCase()}-${p.code.toLowerCase()}`;
          // Only select primary S18/S16 lots are active reference listings; S14 and specialized lots are configurable on request
          const isPrimary = (s === 'S18' || (t.code === 'AR' && s === 'S16'));
          const status = isPrimary ? 'active' : 'configurable_on_request';
          const screenBonus = s === 'S18' ? 15000 : s === 'S16' ? 8000 : 0;
          const procBonus = p.code === 'CBU' ? 12000 : p.code === 'HON' ? 8000 : 0;
          const unitPriceVnd = t.baseVnd + screenBonus + procBonus;
          const unitPriceUsd = Number((unitPriceVnd / 25000).toFixed(2));

          insertProduct.run(
            slug,
            sku,
            'green_bean',
            t.nameEn,
            `Cà Phê Nhân Xanh ${t.nameVi} ${s} — ${p.nameVi}`,
            `Green Coffee ${t.nameEn} ${s} — ${p.nameEn}`,
            `Mã ${sku} · ${t.code === 'CU' ? 'Phân loại hình thái hạt đơn (Peaberry)' : 'Cà phê nhân xanh thương mại B2B'}`,
            `SKU ${sku} · ${t.code === 'CU' ? 'Bean morphology classification (Peaberry)' : 'B2B Commercial Green Coffee'}`,
            `Sản phẩm cà phê nhân xanh ${t.nameVi} kích thước sàng ${s}, phương pháp ${p.nameVi}. Mọi thông số độ ẩm, tỷ trọng, tỷ lệ lỗi và niên vụ chỉ được công bố chính thức khi có chứng thư kiểm định lô hàng xác thực.`,
            `${t.nameEn} green coffee beans graded to ${s} screen size using ${p.nameEn}. Moisture content, density, defect tolerance, and harvest year are published strictly upon verified lot lab certification.`,
            t.nameEn,
            `${t.nameEn} · ${s} · ${p.nameEn}`,
            `${t.nameEn} · ${s} · ${p.nameEn}`,
            1,
            'Nhân xanh chưa rang (Unroasted Green)',
            'Unroasted Green Beans',
            'Áp dụng thử nếm mẫu (Sample Cupping) theo từng lô cung ứng',
            'Sample cupping profile provided per verified export lot',
            JSON.stringify(['Commercial Roasting', 'Sample Roasting', 'Export Blending']),
            JSON.stringify([
              { label: 'Sample 1kg (Đánh giá mẫu)', priceVnd: unitPriceVnd * 2, priceUsd: Number((unitPriceUsd * 2).toFixed(2)) },
              { label: '30kg Bag (Báo giá theo kg)', priceVnd: unitPriceVnd, priceUsd: unitPriceUsd },
              { label: '60kg Jute / PP Bag', priceVnd: unitPriceVnd, priceUsd: unitPriceUsd },
              { label: '69kg Export Bag', priceVnd: unitPriceVnd, priceUsd: unitPriceUsd },
              { label: '1,000kg Big Bag (Container / Contract)', priceVnd: unitPriceVnd, priceUsd: unitPriceUsd },
            ]),
            JSON.stringify(['30kg', '60kg', '69kg', '1,000kg Big Bag']),
            unitPriceVnd,
            unitPriceUsd,
            isPrimary ? 2500 : 0,
            '30kg / Sample 1kg',
            status,
            1,
            '',
            s,
            p.code,
            t.origin,
            'Pending verified harvest lot / Chờ xác nhận niên vụ',
            'Pending verified COA / Chờ chứng thư độ ẩm',
            'Pending verified COA / Chờ đo tỷ trọng',
            'Pending verified COA / Chờ bảng kiểm lỗi',
            `Screen ${s} · ${p.code === 'CBU' ? 'CBU Washed Commercial Designation' : p.nameEn}`,
            'product_green_coffee_beans',
            sku === 'RO-S18-HON' || sku === 'AR-S16-CBU' ? 1 : 0
          );
        }
      }
    }
  }

  const originCount = (db.prepare('SELECT COUNT(*) as c FROM coffee_origins').get() as { c: number }).c;
  if (originCount === 0) {
    const insertOrigin = db.prepare(`
      INSERT INTO coffee_origins (
        slug, region_name_vi, region_name_en, localities_vi, localities_en,
        elevation, varieties, processing_methods, sourcing_status,
        characteristics_vi, characteristics_en, sourcing_note_vi, sourcing_note_en,
        map_x, map_y, latitude, longitude, image_key, photo_attribution, related_skus_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const o of VIETNAM_COFFEE_ORIGINS) {
      insertOrigin.run(
        o.slug,
        o.region_name_vi,
        o.region_name_en,
        o.localities_vi,
        o.localities_en,
        o.elevation,
        o.varieties,
        o.processing_methods,
        o.sourcing_status,
        o.characteristics_vi,
        o.characteristics_en,
        o.sourcing_note_vi,
        o.sourcing_note_en,
        o.map_x,
        o.map_y,
        o.latitude,
        o.longitude,
        o.image_key,
        o.photo_attribution,
        JSON.stringify(o.related_skus)
      );
    }
  }

  const persCount = (db.prepare('SELECT COUNT(*) as c FROM personalities').get() as { c: number }).c;
  if (persCount === 0) {
    const insertPers = db.prepare(`
      INSERT INTO personalities (
        slug, animal_en, animal_vi, traits_vi, traits_en, story_vi, story_en,
        product_association_vi, product_association_en, associated_product_slug,
        is_future_collection, image_key, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of DEEP_PERSONALITY_SEEDS) {
      insertPers.run(
        p.slug,
        p.animal_en,
        p.animal_vi,
        p.traits_vi,
        p.traits_en,
        p.story_vi,
        p.story_en,
        p.product_association_vi,
        p.product_association_en,
        p.associated_product_slug,
        p.is_future_collection,
        p.image_key,
        p.sort_order
      );
    }
  }

  const promoCount = (db.prepare('SELECT COUNT(*) as c FROM promotions').get() as { c: number }).c;
  if (promoCount === 0) {
    const insertPromo = db.prepare(`
      INSERT INTO promotions (
        code, title_vi, title_en, description_vi, description_en,
        promo_type, discount_type, discount_value, max_discount, min_order_value,
        eligible_category, start_date, end_date, usage_limit, used_count,
        per_customer_limit, combinable, member_only, min_tier, terms_vi, terms_en, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertPromo.run(
      'ROARWELCOME10',
      'Ưu đãi Chào Thành Viên Mới — Giảm 10%',
      'New Member Welcome — 10% Off',
      'Giảm 10% (tối đa 100.000đ) cho đơn hàng cà phê rang xay hoặc hòa tan đầu tiên từ 300.000đ.',
      'Enjoy 10% off (up to 100,000 VND) on your first roasted or instant coffee order over 300,000 VND.',
      'welcome',
      'percent',
      10,
      100000,
      300000,
      'roasted',
      '2026-01-01',
      '2027-12-31',
      1000,
      12,
      1,
      0,
      0,
      '',
      'Áp dụng cho sản phẩm cà phê rang xay. Không áp dụng cộng dồn với mã giảm giá khác.',
      'Valid on roasted coffee collections. Cannot be combined with other promotional codes.',
      1
    );

    insertPromo.run(
      'ROARFREESHIP',
      'Miễn Phí Vận Chuyển Đơn Từ 500.000đ',
      'Complimentary Shipping Over 500,000 VND',
      'Hỗ trợ miễn phí giao hàng tiêu chuẩn toàn quốc (tối đa 35.000đ) cho mọi đơn hàng bán lẻ từ 500.000đ.',
      'Complimentary standard domestic shipping (up to 35,000 VND) on retail orders from 500,000 VND.',
      'free_shipping',
      'free_shipping',
      35000,
      35000,
      500000,
      'all',
      '2026-01-01',
      '2027-12-31',
      5000,
      24,
      5,
      1,
      0,
      '',
      'Áp dụng cho tất cả đơn hàng tiêu chuẩn tại Việt Nam.',
      'Valid for standard domestic deliveries across Vietnam.',
      1
    );

    insertPromo.run(
      'RESERVEGOLD15',
      'Đặc Quyền Hạng Thành Viên — Giảm 15% Signature Reserve',
      'Member Privilege — 15% Off Signature Reserve',
      'Ưu đãi dành riêng cho thành viên ROAR Silver trở lên khi đặt mua Signature Reserve hoặc hộp quà tặng.',
      'Exclusive to ROAR Silver tier and above on Signature Reserve tins and presentation boxes.',
      'member_only',
      'percent',
      15,
      200000,
      450000,
      'roasted',
      '2026-01-01',
      '2027-12-31',
      500,
      4,
      2,
      0,
      1,
      'ROAR Silver',
      'Yêu cầu đăng nhập tài khoản ROAR COFFEE Members từ hạng Silver trở lên.',
      'Requires signed-in ROAR COFFEE Member account at Silver tier or higher.',
      1
    );

    // Expired campaign — must never show in active storefront
    insertPromo.run(
      'ROARLAUNCH2025',
      'Chiến dịch ra mắt 2025 (Đã kết thúc)',
      '2025 Launch Campaign (Expired)',
      'Chương trình đã hết hạn.',
      'Expired campaign.',
      'seasonal',
      'percent',
      20,
      150000,
      300000,
      'all',
      '2025-01-01',
      '2025-12-31',
      100,
      100,
      1,
      0,
      0,
      '',
      'Đã hết hạn.',
      'Expired.',
      1
    );
  }

  const journalCount = (db.prepare('SELECT COUNT(*) as c FROM journal_articles').get() as { c: number }).c;
  if (journalCount === 0) {
    const insertArticle = db.prepare(`
      INSERT INTO journal_articles (slug, category, tags_json, title_vi, title_en, excerpt_vi, excerpt_en, content_vi, content_en, author, read_minutes, image_key, published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertArticle.run(
      'understanding-cbu-washed-process-in-vietnam',
      'Coffee processing',
      JSON.stringify(['CBU', 'Washed Process', 'Green Coffee']),
      'Hiểu đúng về CBU — Chuẩn Chế Biến Ướt trong Danh Mục Cà Phê Nhân Xanh ROAR COFFEE',
      'Understanding CBU — Washed Processing in the ROAR COFFEE Green Coffee Architecture',
      'CBU là ký hiệu thương mại chính thức của phương pháp chế biến ướt (Washed Process) tại ROAR COFFEE, giúp kiểm soát độ sạch vị và tính đồng nhất của hạt nhân xanh.',
      'CBU is ROAR COFFEE’s official commercial designation for Washed Process coffee, supporting clean flavor clarity and uniform green bean quality across Robusta, Arabica, and Culi.',
      'Trong thương mại cà phê nhân xanh hiện đại, phương pháp chế biến quyết định trực tiếp đến cấu trúc hương vị, độ sạch (clean cup) và sự ổn định khi rang. Tại ROAR COFFEE, toàn bộ dòng nhân xanh chế biến ướt được chuẩn hóa ký hiệu thương mại là CBU (Chế biến ướt / Washed Process), song hành cùng Natural (Chế biến khô) và Honey.\n\nQuy trình chế biến ướt tách vỏ quả tươi ngay sau thu hoạch chín đỏ, lên men kiểm soát để loại bỏ hoàn toàn lớp nhớt, sau đó rửa sạch và làm khô đến độ ẩm tiêu chuẩn. Nhờ vậy, nhân xanh CBU thường có màu sắc đồng đều, tỷ lệ tạp chất thấp và giúp thợ rang dễ dàng thể hiện bản sắc nguyên bản của vùng trồng.\n\nTại hệ thống sản phẩm B2B của ROAR COFFEE, CBU được cấu hình trên cả 3 dòng Robusta (RO), Arabica (AR) và Culi (CU) với các cỡ sàng S14, S16 và S18.',
      'In modern green coffee trading, post-harvest processing directly shapes cup clarity, roast behavior, and commercial consistency. Across the ROAR COFFEE catalog, CBU serves as the official commercial designation for Washed Process coffee alongside Natural and Honey.\n\nBy depulping ripe cherries promptly, controlling mucilage fermentation, washing cleanly, and drying to stable storage moisture, CBU lots deliver clean visual uniformity and predictable roasting curves.\n\nWithin the ROAR COFFEE B2B matrix, CBU is configurable across Robusta (RO), Arabica (AR), and Culi / Peaberry (CU) in screen sizes S14, S16, and S18.',
      'ROAR Coffee Editorial',
      5,
      'journal_cbu_washed',
      1
    );

    insertArticle.run(
      'culi-peaberry-morphology-explained',
      'Coffee varieties',
      JSON.stringify(['Culi', 'Peaberry', 'Robusta', 'Arabica']),
      'Culi (Peaberry) dưới góc nhìn khoa học: Phân loại hình thái hạt chứ không phải giống loài riêng',
      'Culi (Peaberry) Explained: Bean Morphology Classification, Not a Separate Botanical Species',
      'Làm rõ bản chất sinh học của hạt Culi — hiện tượng một nhân đơn phát triển trọn vẹn trong quả cà phê, tạo nên hình dáng tròn đặc trưng.',
      'Clarifying the botanical reality of Culi (Peaberry): a natural single-seed morphology inside the coffee cherry rather than a separate species.',
      'Nhiều người yêu cà phê thường nhầm lẫn Culi là một giống cà phê độc lập tương đương Robusta hay Arabica. Thực tế khoa học nông học cho thấy Culi (Peaberry) là một phân loại theo hình thái học của hạt.\n\nThông thường mỗi quả cà phê chín chứa hai hạt nhân ép mặt phẳng vào nhau. Trong khoảng 5–10% số quả tự nhiên, chỉ một noãn phát triển thành một hạt tròn đơn duy nhất chiếm trọn khoang quả — đó chính là hạt Culi.\n\nVì hình dáng tròn đặc trưng, hạt Culi cần sự lưu tâm riêng khi sàng lọc kích thước (S14, S16, S18) và khi truyền nhiệt trong trống rang để đảm bảo chín đều từ ngoài vào tâm.',
      'Culi — known internationally as Peaberry — is frequently misunderstood as a separate coffee species alongside Arabica or Robusta. Botanically, however, Culi is a bean morphology classification.\n\nWhereas a normal coffee cherry develops two flat-sided seeds facing one another, a small natural percentage of cherries develop a single round seed that fills the entire cavity. Because of its spherical density, Culi behaves differently during screen grading (S14, S16, S18) and heat transfer in the roasting drum.',
      'ROAR Coffee Editorial',
      4,
      'journal_culi_peaberry',
      1
    );

    insertArticle.run(
      'vietnamese-phin-and-espresso-precision',
      'Brewing techniques',
      JSON.stringify(['Vietnamese Phin', 'Espresso', 'Brewing']),
      'Nghệ thuật cân bằng tỷ lệ khi pha Phin truyền thống và Espresso hiện đại',
      'Dialing In Precision: Traditional Vietnamese Phin Meets Modern Espresso',
      'Hướng dẫn tham chiếu các thông số nhiệt độ 90–94°C, thời gian ủ nở 30 giây cho Phin và tỷ lệ 1:2 cho Espresso.',
      'Reference parameters for 90–94°C water temperature, 30-second phin bloom, and 1:2 espresso extraction ratios.',
      'Dù bạn yêu thích sự chậm rãi của chiếc Phin đồng truyền thống hay nhịp điệu chuẩn xác của máy Espresso hiện đại, mọi tách cà phê cân bằng đều bắt đầu từ tỷ lệ bột cà phê, lượng nước, cỡ xay và nhiệt độ.\n\nVới Phin truyền thống: tham chiếu 20g cà phê xay vừa-thô, châm 25–30ml nước nóng đầu tiên để ủ nở (bloom) trong 30 giây trước khi rót thêm 50–70ml nước, hoàn tất chiết xuất trong khoảng 4–5 phút.\n\nVới Espresso: tham chiếu 18g cà phê đầu vào để thu về 36g chiết xuất trong 25–30 giây ở nhiệt độ 90–94°C.',
      'Whether brewing with a traditional brass Vietnamese Phin or an Italian espresso machine, balanced extraction depends on dose, water volume, grind distribution, and temperature stability.\n\nFor Vietnamese Phin: begin with a 20g reference dose, wet evenly with 25–30ml water for a 30-second bloom, then add 50–70ml hot water for a 4–5 minute drawdown.\n\nFor Espresso: start from an 18g dose yielding 36g liquid beverage in 25–30 seconds at 90–94°C, then refine grind size by taste.',
      'ROAR Barista Lab',
      6,
      'journal_phin_espresso',
      1
    );
  }

  const settingsCount = (db.prepare('SELECT COUNT(*) as c FROM site_settings').get() as { c: number }).c;
  if (settingsCount === 0) {
    const setSetting = db.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?)');
    setSetting.run('brand_name', 'ROAR COFFEE');
    setSetting.run('tagline_en', 'IGNITING COURAGE. DEFINING CHARACTER.');
    setSetting.run('tagline_vi', 'KHƠI BẢN LĨNH. ĐẬM CHẤT RIÊNG.');
    setSetting.run('primary_color', '#00552B');
    setSetting.run('secondary_color', '#003D25');
    setSetting.run('gold_color', '#C6A667');
    setSetting.run('header_logo_mode', 'horizontal');
    setSetting.run('footer_logo_mode', 'vertical');
    setSetting.run('contact_email', 'hello@roarcoffee.vn');
    setSetting.run('b2b_email', 'b2b@roarcoffee.vn');
    setSetting.run('contact_phone', '+84 (0) 28 0000 0000 (Placeholder)');
    setSetting.run('office_address_vi', 'TP. Hồ Chí Minh, Việt Nam (Địa chỉ chính thức cập nhật trước khi vận hành thương mại)');
    setSetting.run('office_address_en', 'Ho Chi Minh City, Vietnam (Official registered address to be confirmed prior to launch)');
  }

  // Seed 1 sample order + points ledger entry for demo member so Dashboard immediately demonstrates real relational data
  const orderCount = (db.prepare('SELECT COUNT(*) as c FROM orders').get() as { c: number }).c;
  if (orderCount === 0) {
    const member = db.prepare('SELECT id FROM users WHERE email = ?').get('member@roarcoffee.vn') as { id: number } | undefined;
    const product = db.prepare('SELECT id, sku, name_vi, name_en FROM products WHERE slug = ?').get('signature-reserve') as
      | { id: number; sku: string; name_vi: string; name_en: string }
      | undefined;
    if (member && product) {
      const info = db.prepare(`
        INSERT INTO orders (
          order_number, user_id, customer_name, customer_email, customer_phone, shipping_address,
          currency, subtotal, discount_amount, points_redeemed, points_discount, shipping_fee, total,
          voucher_code, payment_method, payment_status, order_status, tracking_code, points_awarded
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'RC-20261101-1001',
        member.id,
        'Nguyễn Minh Khôi',
        'member@roarcoffee.vn',
        '0909 123 456',
        '12 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
        'VND',
        490000,
        0,
        0,
        0,
        0,
        490000,
        '',
        'bank_transfer',
        'confirmed_demo',
        'Completed',
        'VN-DEMO-1001',
        49
      );
      const orderId = Number(info.lastInsertRowid);
      db.prepare(`
        INSERT INTO order_items (order_id, product_id, sku, product_name_vi, product_name_en, variant_label, quantity, unit_price_vnd, line_total_vnd)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderId,
        product.id,
        product.sku,
        product.name_vi,
        product.name_en,
        '250g · Signature Tin (Whole Bean)',
        1,
        490000,
        490000
      );
      db.prepare(`
        INSERT INTO points_ledger (user_id, order_id, entry_type, points, description_vi, description_en, expires_at)
        VALUES (?, ?, 'earn_available', ?, ?, ?, datetime('now', '+365 days'))
      `).run(
        member.id,
        orderId,
        49,
        'Điểm thưởng mẫu từ đơn hàng RC-20261101-1001 (Dữ liệu phát triển)',
        'Demo reward points from order RC-20261101-1001 (Development sample)'
      );
    }
  }

  // Wallet balance & Starbucks-style Rewards Wallet transactions
  const userCols = db.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>;
  if (!userCols.some((c) => c.name === 'wallet_balance_vnd')) {
    db.exec(`ALTER TABLE users ADD COLUMN wallet_balance_vnd INTEGER NOT NULL DEFAULT 0;`);
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      tx_type TEXT NOT NULL CHECK(tx_type IN ('topup', 'spend', 'refund')),
      amount_vnd INTEGER NOT NULL,
      bonus_vnd INTEGER NOT NULL DEFAULT 0,
      bonus_pct INTEGER NOT NULL DEFAULT 0,
      points_delta INTEGER NOT NULL DEFAULT 0,
      note TEXT DEFAULT '',
      reference_code TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS wallet_topup_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount_vnd INTEGER NOT NULL,
      bonus_pct INTEGER NOT NULL DEFAULT 0,
      bonus_vnd INTEGER NOT NULL DEFAULT 0,
      total_credit_vnd INTEGER NOT NULL,
      points_delta INTEGER NOT NULL DEFAULT 0,
      reference_code TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      admin_note TEXT DEFAULT '',
      reviewed_by INTEGER,
      reviewed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS daily_checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      checkin_date TEXT NOT NULL,
      streak_day INTEGER NOT NULL DEFAULT 1,
      points_awarded INTEGER NOT NULL DEFAULT 10,
      bonus_reward TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, checkin_date),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS gift_voucher_dispatches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      order_number TEXT NOT NULL,
      product_id INTEGER NOT NULL REFERENCES products(id),
      product_slug TEXT NOT NULL,
      voucher_code TEXT NOT NULL UNIQUE,
      purchase_mode TEXT NOT NULL CHECK(purchase_mode IN ('self', 'gift')),
      delivery_channel TEXT NOT NULL CHECK(delivery_channel IN ('zalo_sms', 'email')),
      sender_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      sender_name TEXT NOT NULL,
      sender_email TEXT NOT NULL DEFAULT '',
      sender_phone TEXT NOT NULL DEFAULT '',
      recipient_name TEXT NOT NULL,
      recipient_contact TEXT NOT NULL,
      gift_message TEXT DEFAULT '',
      face_value_vnd INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending_payment' CHECK(status IN ('pending_payment', 'active', 'redeemed', 'expired', 'cancelled')),
      redeemed_order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
      redeemed_at TEXT,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_gift_voucher_order ON gift_voucher_dispatches(order_id);
    CREATE INDEX IF NOT EXISTS idx_gift_voucher_sender ON gift_voucher_dispatches(sender_user_id);
    CREATE INDEX IF NOT EXISTS idx_gift_voucher_code ON gift_voucher_dispatches(voucher_code);
  `);

  // Idempotent Gift Voucher products (50k, 100k, 500k, 1,000,000 VND)
  const giftVouchers = [
    {
      slug: 'gift-voucher-50k',
      sku: 'RC-GIFT-50K',
      barcode: generateEan13Barcode(9201),
      priceVnd: 50000,
      priceUsd: 2.0,
      nameVi: 'Thẻ Quà Tặng ROAR Gift Voucher 50.000₫',
      nameEn: 'ROAR Coffee Gift Voucher 50,000 VND',
      subVi: 'Phiếu quà tặng điện tử & thẻ cứng mệnh giá 50.000₫ — áp dụng toàn hệ thống ROAR COFFEE®',
      subEn: 'Digital & printed 50,000 VND gift voucher redeemable across all ROAR COFFEE® products',
      descVi:
        'Thẻ quà tặng ROAR COFFEE® mệnh giá 50.000₫ là lời chúc năng lượng tinh tế cho bạn bè, đồng nghiệp. Áp dụng mua mọi dòng cà phê rang xay, cà phê hạt rang theo kg, cà phê hòa tan và bộ quà tặng tại website ROAR COFFEE®.',
      descEn:
        'The 50,000 VND ROAR COFFEE® Gift Voucher is a thoughtful daily treat for friends and colleagues. Redeemable across roasted coffee, whole beans by kg, instant gold, and gift sets.',
      imageKey: '/assets/vouchers/gift-voucher-50k.jpg',
    },
    {
      slug: 'gift-voucher-100k',
      sku: 'RC-GIFT-100K',
      barcode: generateEan13Barcode(9202),
      priceVnd: 100000,
      priceUsd: 4.0,
      nameVi: 'Thẻ Quà Tặng ROAR Gift Voucher 100.000₫',
      nameEn: 'ROAR Coffee Gift Voucher 100,000 VND',
      subVi: 'Phiếu quà tặng mệnh giá 100.000₫ — tặng kèm thiệp chúc mừng sang trọng',
      subEn: '100,000 VND gift voucher with complimentary greeting card',
      descVi:
        'Thẻ quà tặng ROAR COFFEE® mệnh giá 100.000₫ phù hợp làm quà sinh nhật, tri ân khách hàng hoặc phần thưởng nội bộ. Có thể dùng trực tiếp khi thanh toán hoặc nạp quy đổi vào Ví Thành viên ROAR.',
      descEn:
        'Ideal for birthdays, client appreciation, or team rewards. Use directly at checkout or redeem into a ROAR Member Wallet.',
      imageKey: '/assets/vouchers/gift-voucher-100k.jpg',
    },
    {
      slug: 'gift-voucher-500k',
      sku: 'RC-GIFT-500K',
      barcode: generateEan13Barcode(9203),
      priceVnd: 500000,
      priceUsd: 20.0,
      nameVi: 'Thẻ Quà Tặng ROAR Gift Voucher 500.000₫',
      nameEn: 'ROAR Coffee Gift Voucher 500,000 VND',
      subVi: 'Thẻ quà tặng cao cấp mệnh giá 500.000₫ — thiết kế đen huyền ép kim vàng',
      subEn: 'Premium 500,000 VND obsidian-and-gold foil gift card',
      descVi:
        'Thẻ quà tặng ROAR COFFEE® mệnh giá 500.000₫ được thiết kế hộp phong bì đen huyền ép kim vàng champagne. Thích hợp tặng đối tác, cấp trên hoặc người yêu cà phê đặc sản Việt Nam.',
      descEn:
        'Presented in a signature matte obsidian & champagne-gold sleeve, the 500,000 VND Gift Voucher is crafted for partners, executives, and specialty coffee lovers.',
      imageKey: '/assets/vouchers/gift-voucher-500k.jpg',
    },
    {
      slug: 'gift-voucher-1m',
      sku: 'RC-GIFT-1M',
      barcode: generateEan13Barcode(9204),
      priceVnd: 1000000,
      priceUsd: 40.0,
      nameVi: 'Thẻ Quà Tặng ROAR Gift Voucher 1.000.000₫',
      nameEn: 'ROAR Coffee Gift Voucher 1,000,000 VND',
      subVi: 'Thẻ quà tặng VIP mệnh giá 1.000.000₫ — đặc quyền khách hàng Signature Reserve',
      subEn: 'VIP 1,000,000 VND gift voucher with Signature Reserve privileges',
      descVi:
        'Thẻ quà tặng VIP ROAR COFFEE® mệnh giá 1.000.000₫ dành cho quà tặng doanh nghiệp, lễ Tết và tri ân đối tác chiến lược. Hạn sử dụng 12 tháng, áp dụng toàn bộ danh mục bán lẻ, hạt rang theo kg và quà tặng cao cấp.',
      descEn:
        'Our flagship 1,000,000 VND VIP Gift Voucher tailored for corporate gifting, festive occasions, and strategic partners. Valid for 12 months across all retail, kg beans, and reserve collections.',
      imageKey: '/assets/vouchers/gift-voucher-1m.jpg',
    },
  ];

  const checkProd = db.prepare('SELECT id FROM products WHERE slug = ?');
  const insertGift = db.prepare(`
    INSERT INTO products (
      slug, sku, barcode, category, sub_category, name_vi, name_en, subtitle_vi, subtitle_en,
      description_vi, description_en, coffee_type, blend_summary_vi, blend_summary_en,
      roast_profile_vi, roast_profile_en, tasting_notes_vi, tasting_notes_en,
      brewing_methods_json, variants_json, price_vnd, price_usd, inventory, image_key,
      featured, status
    ) VALUES (?, ?, ?, 'roasted', 'Gift Voucher', ?, ?, ?, ?, ?, ?, 'Gift Voucher', ?, ?, ?, ?, ?, ?, '[]', ?, ?, ?, 999, ?, 1, 'active')
  `);
  for (const g of giftVouchers) {
    if (!checkProd.get(g.slug)) {
      insertGift.run(
        g.slug,
        g.sku,
        g.barcode,
        g.nameVi,
        g.nameEn,
        g.subVi,
        g.subEn,
        g.descVi,
        g.descEn,
        `Mệnh giá ${g.priceVnd.toLocaleString('vi-VN')}₫ · Hạn dùng 12 tháng`,
        `Value ${g.priceVnd.toLocaleString('vi-VN')} VND · Valid 12 months`,
        'Thẻ cứng ép kim & Mã điện tử',
        'Foil Card & Digital Code',
        'Áp dụng toàn hệ thống ROAR COFFEE®',
        'Redeemable storewide at ROAR COFFEE®',
        JSON.stringify([
          { label: `E-Voucher (${g.priceVnd.toLocaleString('vi-VN')}₫)`, priceVnd: g.priceVnd, priceUsd: g.priceUsd },
          { label: `Thẻ cứng + Hộp quà (${g.priceVnd.toLocaleString('vi-VN')}₫)`, priceVnd: g.priceVnd, priceUsd: g.priceUsd },
        ]),
        g.priceVnd,
        g.priceUsd,
        g.imageKey
      );
    }
  }

  // Idempotent rich Journal Articles (replaceable images in CMS) — strictly mapped to the 5 official categories
  const extraJournalArticles = [
    {
      slug: 'nghe-thuat-pha-phin-viet-nam-chuan-roar',
      category: 'Brewing techniques',
      tags: ['Pha Phin', 'Robusta', 'Văn hóa cà phê'],
      titleVi: 'Nghệ Thuật Pha Phin Việt Nam: 5 Bí Quyết Chiết Xuất Đậm Sâu Không Chát',
      titleEn: 'The Art of Vietnamese Phin Brewing: 5 Secrets for Rich, Clean Extraction',
      excerptVi: 'Từ độ mịn cỡ bột, nhiệt độ nước 92–95°C đến kỹ thuật ủ bloom 30 giây giúp ly cà phê Phin dậy hương sô-cô-la và hậu ngọt kéo dài.',
      excerptEn: 'From grind size and 92–95°C water temperature to the 30-second bloom that unlocks deep cacao aromatics and a clean sweet finish.',
      contentVi:
        'Pha Phin không chỉ là một phương pháp chiết xuất — đó là nghi thức chậm rãi đặc trưng của người Việt. Để ly Phin đạt độ sánh mịn mà không bị khét hay chát gắt, yếu tố đầu tiên là chọn cà phê rang mộc 100% ở mức Medium-Dark như dòng Sư Tử (Lion) hoặc Robusta S18.\n\n1. Tráng nóng Phin bằng nước sôi trước khi cho 25g bột cà phê xay vừa-thô.\n2. Rót 25ml nước 92–95°C ủ nở (bloom) trong 30 giây để giải phóng khí CO2.\n3. Nén nhẹ nắp gài vừa tay, sau đó châm thêm 65ml nước nóng.\n4. Tốc độ nhỏ giọt lý tưởng là 1 giọt/giây, hoàn tất trong 4–5 phút để thu được cốt cà phê thơm đậm, sánh mượt.',
      contentEn:
        'Vietnamese Phin brewing is a mindful ritual. Start with 100% pure Medium-Dark roasted coffee such as ROAR Lion or Robusta S18.\n\n1. Pre-warm the Phin with hot water and dose 25g medium-coarse ground coffee.\n2. Bloom with 25ml water at 92–95°C for 30 seconds.\n3. Gently rest the gravity press and pour 65ml hot water.\n4. Aim for 1 drop per second over 4–5 minutes for syrupy body and lingering cacao sweetness.',
      author: 'ROAR Head Barista',
      readMinutes: 5,
      imageKey: 'journal_phin_ritual',
    },
    {
      slug: 'hanh-trinh-arabica-cau-dat-1500m',
      category: 'Coffee origins',
      tags: ['Cầu Đất', 'Arabica', 'Vùng trồng'],
      titleVi: 'Cầu Đất 1.500m: Vì Sao Sương Mù Đà Lạt Tạo Nên Hạt Arabica Hương Hoa Trứ Danh?',
      titleEn: 'Cầu Đất 1,500m: How Đà Lạt Mist Crafts Iconic Floral Arabica',
      excerptVi: 'Khí hậu ôn đới quanh năm và biên độ nhiệt ngày – đêm lớn giúp quả cà phê chín chậm, tích tụ đường tự nhiên và axit trái cây thanh tao.',
      excerptEn: 'Cool year-round temperatures and wide day-night swings slow cherry maturation, concentrating natural sugars and sparkling citrus acidity.',
      contentVi:
        'Nằm ở độ cao hơn 1.500m so với mực nước biển, cao nguyên Cầu Đất (Đà Lạt, Lâm Đồng) được ví như "thủ phủ Arabica" của Việt Nam. Nhiệt độ mát mẻ 15–22°C kéo dài thời gian chín của quả cà phê, giúp hạt chắc nặng và giàu hợp chất hương thơm.\n\nTại ROAR COFFEE®, các lô Arabica S18 và Arabica S18 CBU đều được thu hái chọn lọc quả chín đỏ trên 95%, sơ chế ướt (Full Washed) bằng nguồn nước suối sạch cao nguyên để giữ trọn nốt hương hoa nhài, cam chín và hậu vị mật ong thanh khiết.',
      contentEn:
        'Rising above 1,500m in Lâm Đồng, Cầu Đất is Vietnam’s premier Arabica terroir. Cool 15–22°C days slow cherry ripening, building dense beans rich in aromatic precursors.\n\nROAR COFFEE® selects 95%+ red-ripe cherries for our Arabica S18 and Arabica S18 CBU lots, washed cleanly to preserve jasmine blossom, ripe citrus, and honeyed sweetness.',
      author: 'ROAR Sourcing Team',
      readMinutes: 6,
      imageKey: 'journal_caudat_arabica',
    },
    {
      slug: 'phan-biet-natural-honey-va-cbu-washed',
      category: 'Coffee processing',
      tags: ['CBU Washed', 'Honey', 'Natural', 'Chế biến'],
      titleVi: 'Phân Biệt 3 Phương Pháp Chế Biến: Natural, Honey & Chế Biến Ướt (CBU)',
      titleEn: 'Natural vs. Honey vs. Washed (CBU): How Processing Shapes Your Cup',
      excerptVi: 'Cùng một giống hạt S18 nhưng phương pháp sơ chế quyết định tới 40% hương vị cuối cùng trong tách cà phê của bạn.',
      excerptEn: 'Even from the same S18 harvest, post-harvest processing defines up to 40% of the final flavor profile in your cup.',
      contentVi:
        '• Chế biến khô (Natural): Phơi nguyên quả chín trên giàn lưới 18–25 ngày, tạo body dày, vị ngọt đậm và nốt trái cây chín nồng nàn.\n• Chế biến mật ong (Honey Process): Xát vỏ giữ lại lớp nhầy đường tự nhiên (mucilage) rồi phơi nắng kiểm soát, mang đến vị caramel mật ong cân bằng hoàn hảo.\n• Chế biến ướt (Full Washed / CBU): Lên men tách sạch lớp nhầy và rửa kỹ trước khi phơi, cho tách cà phê trong trẻo, hương sạch tinh khiết và hậu vị mượt mà — chuẩn mực của các dòng Espresso & Signature Reserve tại ROAR COFFEE®.',
      contentEn:
        '• Natural: Whole ripe cherries dried on raised beds for 18–25 days, producing heavy body and jammy fruit sweetness.\n• Honey Process: Pulped with natural mucilage intact for honeyed caramel balance.\n• Full Washed (CBU): Fermented and thoroughly washed for crisp clarity, clean aromatics, and silky finish — the backbone of ROAR Espresso & Signature Reserve.',
      author: 'ROAR Q-Grader Lab',
      readMinutes: 5,
      imageKey: 'journal_coffee_processes',
    },
    {
      slug: 'bi-quyet-chon-hat-rang-s18-cho-quan-espresso',
      category: 'Coffee knowledge',
      tags: ['Hạt rang S18', 'Espresso', 'Quán cà phê', 'Giá sỉ kg'],
      titleVi: 'Bí Quyết Chọn Hạt Rang S18 & Tối Ưu Cost Ly Cho Chủ Quán Espresso',
      titleEn: 'Choosing Screen 18 Roasted Beans & Optimizing Espresso Bar Cost',
      excerptVi: 'Cách phối trộn Robusta S18 CBU và Arabica S18 để đạt lớp crema dày hổ phách, vị cân bằng và tối ưu chi phí với bảng giá 5 bậc theo kg.',
      excerptEn: 'How to blend Robusta S18 CBU and Arabica S18 for tiger-striped crema, balanced sweetness, and smart 5-tier kg wholesale margins.',
      contentVi:
        'Với các quán cà phê hiện đại, sự ổn định giữa các mẻ rang là yếu tố sống còn. Hạt rang chuẩn sàng 18 (7.1mm) của ROAR COFFEE® có kích thước đồng đều giúp quá trình rang chín đều từ tâm ra vỏ, hạn chế tối đa hạt cháy xém.\n\nGợi ý công thức phối trộn phổ biến cho quán:\n• Gu truyền thống / Cà phê sữa máy: 70% Robusta S18 CBU + 30% Arabica S18.\n• Gu hiện đại / Latte & Americano: 50% Arabica S18 CBU + 50% Robusta S18 Honey.\nVới bảng giá tự động 5 mức (1kg, 5–19kg, 20–49kg, 50–99kg và Sỉ ≥100kg), chủ quán dễ dàng dự toán chi phí nguyên liệu minh bạch ngay trên website.',
      contentEn:
        'Batch-to-batch consistency makes or breaks a café. ROAR Screen 18 (7.1mm) roasted beans ensure uniform heat transfer and zero scorching.\n\nPopular café blend ratios:\n• Classic Iced Milk Espresso: 70% Robusta S18 CBU + 30% Arabica S18.\n• Modern Latte & Americano: 50% Arabica S18 CBU + 50% Robusta S18 Honey.\nOur automatic 5-tier kg pricing (1kg up to ≥100kg wholesale) keeps your per-cup cost transparent and predictable.',
      author: 'ROAR HORECA Advisory',
      readMinutes: 6,
      imageKey: 'journal_s18_roastery',
    },
    {
      slug: '7-ca-tinh-roar-va-gu-thuong-thuc-cua-ban',
      category: 'Coffee knowledge',
      tags: ['7 Cá tính', 'Signature Reserve', 'Gu uống'],
      titleVi: '7 Cá Tính ROAR COFFEE®: Bạn Thuộc Gu Thưởng Thức Nào?',
      titleEn: 'The 7 ROAR Personalities: Which Coffee Archetype Matches Your Palate?',
      excerptVi: 'Từ bản lĩnh mạnh mẽ của Hổ & Sư Tử đến sự tinh tế của Cáo, Đại Bàng và đẳng cấp Báo Đen Signature Reserve.',
      excerptEn: 'From the bold power of Tiger & Lion to the finesse of Fox, Eagle, and the obsidian prestige of Black Panther Signature Reserve.',
      contentVi:
        'Mỗi người uống cà phê đều mang một cá tính riêng biệt. Thay vì đặt tên kỹ thuật khô khan, ROAR COFFEE® khắc họa 7 biểu tượng linh thú gắn liền với từng hồ sơ hương vị:\n\n• Hổ (Tiger) & Sư Tử (Lion): Dành cho người yêu vị đậm bản lĩnh, pha Phin truyền thống và cà phê sữa đá.\n• Cáo (Fox) & Đại Bàng (Eagle): Thanh thoát, cân bằng, hương hoa trái tinh tế cho Espresso và Pour Over.\n• Sói (Wolf) & Cú Mèo (Owl): Tiện lợi, tỉnh táo tức thì cho nhịp sống bận rộn và sáng tạo đêm.\n• Báo Đen (Black Panther — Signature Reserve): Đỉnh cao phối trộn 60% Robusta – 20% Culi – 20% Arabica CBU cho những khoảnh khắc trang trọng.',
      contentEn:
        'Every coffee drinker carries a distinct rhythm. ROAR COFFEE® maps 7 wildlife archetypes directly to flavor profiles:\n\n• Tiger & Lion: Bold, commanding body for traditional Phin and iced milk coffee.\n• Fox & Eagle: Balanced, aromatic finesse for Espresso and Pour Over.\n• Wolf & Owl: Effortless clarity for busy mornings and late-night creators.\n• Black Panther (Signature Reserve): Our flagship 60% Robusta – 20% Culi – 20% Washed Arabica masterpiece.',
      author: 'ROAR Editorial',
      readMinutes: 4,
      imageKey: 'journal_tasting_archetypes',
    },
    {
      slug: 'van-hoa-cold-brew-va-qua-tang-ca-phe-cao-cap',
      category: 'Coffee knowledge',
      tags: ['Cold Brew', 'Quà tặng', 'Gift Voucher'],
      titleVi: 'Cold Brew 16 Giờ & Xu Hướng Quà Tặng Cà Phê Cao Cấp Cho Doanh Nghiệp',
      titleEn: '16-Hour Cold Brew & The Rise of Executive Coffee Gifting',
      excerptVi: 'Khám phá phương pháp ủ lạnh mượt mà ít đắng và cách chọn hộp quà Signature Reserve hoặc ROAR Gift Voucher cho đối tác.',
      excerptEn: 'Discover smooth, low-acidity cold extraction alongside Signature Reserve canisters and ROAR Gift Vouchers for corporate gifting.',
      contentVi:
        'Ủ lạnh (Cold Brew) ở nhiệt độ mát trong 14–16 giờ giúp chiết xuất trọn vẹn vị ngọt tự nhiên và hương hoa trái của Arabica S18 mà giảm tới 60% độ chua gắt. Kết hợp cùng một lát cam vàng hoặc mật ong, đây là thức uống giải nhiệt tinh tế cho ngày làm việc năng suất.\n\nBên cạnh đó, xu hướng tặng quà doanh nghiệp đang dịch chuyển sang những trải nghiệm thưởng thức thực thụ: Hộp thiếc Signature Reserve đen huyền ép kim vàng hoặc Thẻ Quà Tặng ROAR Gift Voucher (50k – 100k – 500k – 1.000.000₫) giúp người nhận tự do chọn đúng gu cà phê yêu thích.',
      contentEn:
        'Steeping coarse Arabica S18 in cold filtered water for 14–16 hours unlocks velvety sweetness while reducing harsh acidity by up to 60%.\n\nMeanwhile, executive gifting is shifting toward experiential rituals: obsidian-and-gold Signature Reserve canisters or ROAR Gift Vouchers (50k to 1,000,000 VND) let recipients choose their exact roast and brew style.',
      author: 'ROAR Lifestyle Desk',
      readMinutes: 5,
      imageKey: 'journal_coldbrew_gifting',
    },
    // +2 New Articles for 'Coffee processing'
    {
      slug: 'nhiet-do-va-do-am-len-men-hat-nhan-xanh',
      category: 'Coffee processing',
      tags: ['Lên men', 'Độ ẩm 10–12%', 'Nhân xanh', 'Phơi giàn'],
      titleVi: 'Kiểm Soát Nhiệt Độ Lên Men & Độ Ẩm 10–12% Khi Phơi Giàn Nhân Xanh',
      titleEn: 'Controlling Fermentation Temperature & 10–12% Moisture on Raised Drying Beds',
      excerptVi: 'Vì sao độ ẩm vượt ngưỡng 12.5% làm nhân xanh nhanh lão hóa và bí quyết phơi giàn nâng cao giữ trọn đường tự nhiên trong hạt.',
      excerptEn: 'Why moisture above 12.5% accelerates green bean aging, and how raised-bed drying preserves natural sugars and aromatic longevity.',
      contentVi:
        'Trong sản xuất cà phê nhân xanh chất lượng cao, thu hái quả chín đỏ mới chỉ là một nửa chặng đường. Quá trình lên men kiểm soát (18–36 giờ ở nhiệt độ 22–28°C) và giai đoạn làm khô quyết định độ ổn định của lô hàng suốt 12 tháng bảo quản.\n\nTại các trạm sơ chế đối tác của ROAR COFFEE®, hạt sau lên men được phơi trên giàn lưới nâng cao cách mặt đất ít nhất 80cm giúp luồng gió đối lưu đều hai mặt và tránh hoàn toàn ẩm đất.\n\n• Độ ẩm mục tiêu: Khóa chuẩn 10.5% – 12.0% bằng máy đo chuyên dụng.\n• Đảo hạt định kỳ 2 giờ/lần trong khung giờ nắng cao điểm để tránh nứt vỏ trấu.\n• Sau khi đạt chuẩn ẩm, lô hàng được ủ nghỉ trong bao bảo quản kín 14–21 ngày trước khi xát vỏ lụa và phân sàng S14/S16/S18.',
      contentEn:
        'Picking 95%+ ripe cherries is only half the journey in specialty-grade green coffee production. Controlled fermentation (18–36 hours at 22–28°C) and slow drying determine a lot’s cup stability over 12 months of warehousing.\n\nAt ROAR COFFEE® partner stations, parchment and whole cherries dry on elevated mesh beds at least 80cm off the ground for clean airflow and zero soil contamination.\n\n• Target Moisture: Calibrated strictly to 10.5%–12.0%.\n• Turning Schedule: Raked every 2 hours during peak sun to ensure uniform water activity.\n• Resting Phase: Stored in hermetic resting bags for 14–21 days prior to hulling and S14/S16/S18 grading.',
      author: 'ROAR Processing Lab',
      readMinutes: 6,
      imageKey: 'journal_coffee_processes',
    },
    {
      slug: 'quy-trinh-tach-vo-xat-nhot-cbu-khep-kin',
      category: 'Coffee processing',
      tags: ['CBU Washed', 'Tách vỏ', 'Nước sạch', 'Sơ chế ướt'],
      titleVi: 'Từ Quả Chín Đỏ Đến Nhân Xanh CBU: Vì Sao 24 Giờ Đầu Quyết Định Độ Sạch Vị?',
      titleEn: 'Cherry to CBU Green Bean: Why the First 24 Hours Define Cup Clarity',
      excerptVi: 'Cận cảnh quy trình phân tách tỷ trọng, xát vỏ thịt tươi trong ngày và rửa sạch nhớt giúp Robusta & Arabica đạt độ trong trẻo tinh khiết.',
      excerptEn: 'Inside same-day density sorting, fresh cherry pulping, and clean-water washing that eliminate defects and elevate cup purity.',
      contentVi:
        'Khái niệm "24 giờ vàng" trong chế biến ướt (CBU — Chế Biến Ướt) bắt đầu ngay khi bao quả chín đỏ rời rẫy. Nếu quả bị ủ đống qua đêm trong bao tải, quá trình lên men yếm khí mất kiểm soát sẽ sinh ra mùi chua giấm hoặc mùi lên men quá chín.\n\n1. Rửa tuyển nổi tỷ trọng (Float Separation): Toàn bộ quả chín được đưa qua bể nước sạch trong vòng 4–6 giờ sau thu hoạch để loại bỏ quả khô, quả lép và tạp chất.\n2. Xát vỏ thịt tươi ngay trong đêm: Lớp vỏ ngoài được tách bỏ bằng máy đĩa chính xác không làm dập nhân thóc.\n3. Rửa sạch nhớt (Washing Channels): Sau 16–24 giờ phân hủy lớp nhớt đường tự nhiên, hạt thóc được rửa nhiều lần bằng nước sạch trước khi phơi khô hoàn toàn.',
      contentEn:
        'The golden 24-hour window in Full Washed (CBU) processing begins the moment cherries leave the harvest basket. Leaving fresh cherries stacked in sacks overnight triggers uncontrolled anaerobic heat and sour off-flavors.\n\n1. Water Density Floatation: Within 4–6 hours of picking, cherries enter clean floatation tanks to skim out under-ripe floaters and twigs.\n2. Same-Night Pulping: Disc pulpers strip the fruit skin cleanly without nicking the fragile parchment.\n3. Clean Channel Washing: Following 16–24 hours of controlled mucilage breakdown, parchment is rinsed crystal clear before raised-bed drying.',
      author: 'ROAR Quality Control',
      readMinutes: 5,
      imageKey: 'journal_cbu_washed',
    },
    // +2 New Articles for 'Coffee varieties'
    {
      slug: 'robusta-tr4-tr9-va-arabica-catimor-bourbon-viet-nam',
      category: 'Coffee varieties',
      tags: ['TR4', 'TR9', 'Catimor', 'Bourbon', 'Giống cà phê'],
      titleVi: 'Giải Mã Các Giống Cà Phê Chủ Lực Tại Việt Nam: Robusta TR4/TR9, Catimor & Bourbon',
      titleEn: 'Decoding Vietnam’s Key Coffee Cultivars: Robusta TR4/TR9, Catimor & Bourbon',
      excerptVi: 'Đặc điểm sinh học, kích thước nhân, năng suất và cấu trúc hương vị riêng biệt của những giống cà phê làm nên thương hiệu cà phê Việt.',
      excerptEn: 'Botanical traits, bean density, and signature flavor architecture behind Vietnam’s most celebrated Robusta and Arabica cultivars.',
      contentVi:
        'Không phải mọi hạt Robusta hay Arabica đều mang hương vị giống nhau. Tại Việt Nam, bức tranh di truyền cây cà phê vô cùng phong phú:\n\n• Robusta TR4 & TR9 (Viện Eakmat): Hạt to tròn đồng đều (tỷ lệ đạt sàng S16–S18 rất cao), hàm lượng đường và lipid dồi dào cho vị sô-cô-la sánh đậm khi rang chuẩn.\n• Arabica Catimor: Giống chủ lực tại Cầu Đất và Tây Bắc, kháng gỉ sắt tốt, cân bằng hài hòa giữa độ chua cam chanh sáng và thân vị caramel.\n• Arabica Bourbon & Typica: Sản lượng khiêm tốn ở độ cao >1.500m Lâm Đồng nhưng mang nốt hương hoa nhài, trà trắng và hậu vị mật ong cực kỳ tinh tế.',
      contentEn:
        'Not all Robusta or Arabica harvests taste the same—cultivar genetics lay the structural foundation of every roast:\n\n• Robusta TR4 & TR9 (Eakmat Clones): Broad, dense cherries yielding high Screen 16–18 percentages with rich lipids and deep dark-chocolate crema.\n• Arabica Catimor: Backbone of Cầu Đất and Northwest Vietnam, pairing leaf-rust resilience with vibrant citrus sparkle and sweet caramel body.\n• Bourbon & Typica: Rare heirloom lots grown above 1,500m in Lâm Đồng prized for jasmine florals, white tea clarity, and lingering wildflower honey.',
      author: 'ROAR Agronomy Desk',
      readMinutes: 6,
      imageKey: 'journal_culi_peaberry',
    },
    {
      slug: 'tieu-chuan-sang-s14-s16-s18-trong-thuong-mai',
      category: 'Coffee varieties',
      tags: ['S14', 'S16', 'S18', 'Phân loại hạt', 'B2B'],
      titleVi: 'Cỡ Sàng S14, S16, S18 (5.5mm – 7.1mm): Hiểu Đúng Để Chọn Hạt Rang & Nhân Xanh Chuẩn',
      titleEn: 'Screen Sizes S14, S16 & S18 (5.5mm–7.1mm): How Grading Impacts Roasting',
      excerptVi: 'Kích thước lỗ sàng tiêu chuẩn quốc tế ảnh hưởng trực tiếp đến sự truyền nhiệt trong trống rang, tỷ lệ đồng đều và cấu trúc giá thành.',
      excerptEn: 'Why standardized millimeter screen grading governs drum heat transfer, batch uniformity, and wholesale roast economics.',
      contentVi:
        'Trong thương mại cà phê nhân xanh và hạt rang B2B, ký hiệu S14, S16 hay S18 là đơn vị đo kích thước lỗ sàng tròn theo hệ 1/64 inch (Screen Number):\n\n• Sàng S14 (5.5mm): Hạt nhỏ hơn nhưng mật độ cứng chắc, truyền nhiệt nhanh, thường dùng tối ưu chi phí cho các dòng phối trộn hòa tan hoặc rang xay phổ thông.\n• Sàng S16 (6.3mm): Tiêu chuẩn thương mại phổ biến nhất toàn cầu, cân bằng giữa hiệu suất kinh tế và độ đồng đều khi rang công suất lớn.\n• Sàng S18 (7.1mm): Tuyển chọn những hạt to đều vượt trội (chỉ chiếm tỷ lệ chọn lọc cao của mùa vụ), cho khả năng chín đều từ tâm ra vỏ và lớp crema dày đẹp lý tưởng cho Espresso & Phin cao cấp.',
      contentEn:
        'Across commercial green and roasted trading, S14, S16, and S18 denote aperture diameter measured in 1/64ths of an inch:\n\n• Screen 14 (5.5mm): Compact, dense beans that conduct heat quickly—often deployed in high-efficiency commercial and instant blends.\n• Screen 16 (6.3mm): The global commercial workhorse balancing roast consistency and cost efficiency.\n• Screen 18 (7.1mm+): Top-tier jumbo screening prized by ROAR Espresso and specialty cafés for uniform heat penetration, zero scorching, and lustrous crema.',
      author: 'ROAR Roastery Engineering',
      readMinutes: 5,
      imageKey: 'journal_s18_roastery',
    },
    // +2 New Articles for 'Brewing techniques'
    {
      slug: 'ty-le-bloom-chiet-xuat-va-can-bang-do-chua-ngot',
      category: 'Brewing techniques',
      tags: ['Bloom', 'Pour Over', 'Chiết xuất', 'Độ mịn'],
      titleVi: 'Kỹ Thuật Ủ Bloom 30–45 Giây & Điều Chỉnh Độ Mịn Để Hết Chua Gắt Khi Pha Thủ Công',
      titleEn: 'Mastering the 30–45s Bloom & Grind Calibration for Balanced Manual Pour Over',
      excerptVi: 'Hiểu cơ chế thoát khí CO2 từ cà phê rang mới và quy tắc chỉnh cỡ xay 2 nấc giúp tách V60 hoặc Kalita ngọt tròn không bị chát.',
      excerptEn: 'Understanding CO2 degassing in fresh roasts and two-click grind adjustments to fix sour under-extraction or bitter channels.',
      contentVi:
        'Nếu ly Pour Over (V60/Kalita) của bạn có vị chua gắt thiếu ngọt hoặc nhanh loãng, nguyên nhân 80% nằm ở khâu ủ bloom và cỡ xay chưa khớp:\n\n1. Ủ Bloom đúng lượng: Rót lượng nước gấp 2–2.5 lần khối lượng bột (vd: 45g nước cho 18g cà phê) ở 92–94°C, lắc nhẹ phễu để làm ướt toàn bộ bột và chờ 35–40 giây cho khí CO2 thoát hết.\n2. Quy tắc đọc vị để chỉnh cỡ xay:\n   • Nếu tách bị chua gắt, nước chảy quá nhanh dưới 2 phút → Xay MỊN hơn 1–2 nấc.\n   • Nếu tách bị đắng khé, nghẹt dòng chảy trên 3 phút 30 giây → Xay THÔ hơn 1–2 nấc.\nÁp dụng với ROAR Arabica Selection rang tươi, bạn sẽ thu được tách cà phê trong trẻo với hậu vị mật ong rõ nét.',
      contentEn:
        'When manual Pour Over tastes sharply sour or hollow, 80% of the cause traces back to skipped CO2 bloom or mismatched grind size:\n\n1. Wetting & Bloom: Pour 2–2.5x water to coffee weight (e.g., 45g water for 18g dose) at 92–94°C, swirl gently, and rest 35–40 seconds until bubbling subsides.\n2. Dialing In by Taste:\n   • Sharp, thin, under 2:00 drawdown → Grind 1–2 clicks FINER.\n   • Dry, harsh bitterness, over 3:30 drawdown → Grind 1–2 clicks COARSER.\nPaired with freshly roasted ROAR Arabica Selection, this calibration unlocks crisp citrus sweetness and a silky honeyed finish.',
      author: 'ROAR Head Barista',
      readMinutes: 5,
      imageKey: 'journal_phin_ritual',
    },
    {
      slug: 'kien-truc-tang-huong-espresso-crema-va-ristretto',
      category: 'Brewing techniques',
      tags: ['Espresso', 'Ristretto', 'Lungo', 'Crema'],
      titleVi: 'Phân Biệt Ristretto, Espresso & Lungo: Cách Thời Gian Chiết Xuất Định Hình Hậu Vị',
      titleEn: 'Ristretto vs. Espresso vs. Lungo: How Yield Ratios Shape Sweetness & Body',
      excerptVi: 'Cùng một liều bột 18g dưới áp suất 9 bar, việc dừng máy ở giây thứ 20, 28 hay 36 sẽ tạo ra ba cấu trúc hương vị hoàn toàn khác biệt.',
      excerptEn: 'From one 18g basket at 9 bars, stopping extraction at 20s, 28s, or 36s produces three completely different flavor architectures.',
      contentVi:
        'Trong chiết xuất áp suất cao 9 bar, các nhóm hợp chất hương vị tan vào nước theo thứ tự thời gian rõ rệt: Axit hữu cơ và tinh dầu thơm ra trước (giây 5–15), đường caramel ra giữa (giây 15–25), và các chất đắng tannin/caffeine hòa tan mạnh ở giai đoạn cuối.\n\n• Ristretto (Tỷ lệ 1:1.5 — 18g bột thu 27g cốt trong 20–24 giây): Ngọt đậm đặc như mật, hương sô-cô-la cô đặc, hoàn hảo cho Cortado và Flat White.\n• Espresso Chuẩn (Tỷ lệ 1:2 — 18g thu 36g cốt trong 26–30 giây): Cấu trúc cân bằng vàng giữa độ sánh, crema hổ phách và hậu ngọt kéo dài — lý tưởng cho ROAR Espresso (Cáo) & Espresso Gold (Đại Bàng).\n• Lungo (Tỷ lệ 1:3 — 18g thu 54g cốt): Thanh nhẹ hơn, cường độ caffeine trích ly cao hơn nhưng cần kiểm soát cỡ xay thô nhẹ để không bị chát.',
      contentEn:
        'Under 9 bars of espresso pressure, flavor compounds dissolve sequentially: bright organic acids and aromatics extract first (5–15s), caramelized sugars follow (15–25s), and heavier bitter polyphenols emerge last.\n\n• Ristretto (1:1.5 ratio — 18g in, 27g out in 20–24s): Syrupy, intense cacao sweetness—ideal for Cortados and Flat Whites.\n• Classic Espresso (1:2 ratio — 18g in, 36g out in 26–30s): The golden equilibrium of tiger-striped crema, sweetness, and length—tailored for ROAR Fox & Eagle blends.\n• Lungo (1:3 ratio — 18g in, 54g out): Longer, tea-like body; grind slightly coarser to keep the finish clean and sweet.',
      author: 'ROAR Espresso Bar Team',
      readMinutes: 6,
      imageKey: 'journal_phin_espresso',
    },
    // +2 New Articles for 'Coffee knowledge'
    {
      slug: 'phan-ung-maillard-va-first-crack-trong-rang-ca-phe',
      category: 'Coffee knowledge',
      tags: ['Maillard', 'First Crack', 'Rang cà phê', 'Agtron'],
      titleVi: 'Phản Ứng Maillard & Tiếng Nổ First Crack: Điều Gì Xảy Ra Bên Trong Trống Rang?',
      titleEn: 'The Maillard Reaction & First Crack: What Happens Inside the Roasting Drum?',
      excerptVi: 'Khám phá 3 giai đoạn hóa học biến hạt nhân xanh mùi cỏ ngái thành hàng trăm hợp chất hương sô-cô-la, hạt dẻ và caramel.',
      excerptEn: 'Inside the thermal chemistry that transforms grassy green beans into hundreds of cacao, hazelnut, and caramel aromatics.',
      contentVi:
        'Cà phê nhân xanh vốn gần như không có mùi thơm cà phê quen thuộc. Phép màu chỉ xảy ra khi hạt đi qua 3 pha nhiệt độ chính xác bên trong trống rang:\n\n1. Pha làm khô (Drying Phase · đến ~150°C): Nước bên trong hạt bốc hơi, hạt chuyển màu từ xanh ngọc sang vàng nhạt và tỏa hương bánh mì nướng.\n2. Pha Maillard & Caramel hóa (150°C – 195°C): Axit amin phản ứng với đường tạo nên hơn 800 hợp chất thơm (hạt dẻ rang, caramel, bơ, mật mía).\n3. Tiếng nổ First Crack (~196°C – 202°C): Áp suất hơi nước phá vỡ cấu trúc tế bào tạo tiếng nổ giòn như bắp rang. Thời gian phát triển sau First Crack (Development Time Ratio ~15–22%) chính là bí quyết để thợ rang ROAR COFFEE® định hình độ sáng thanh cho Arabica hay độ đậm sánh cho Robusta.',
      contentEn:
        'Raw green beans carry almost none of the aromas we associate with brewed coffee. That transformation unfolds across three thermal phases inside the drum:\n\n1. Drying Phase (up to ~150°C): Internal moisture evaporates as beans turn from jade green to pale straw, smelling of toasted grain.\n2. Maillard & Caramelization (150°C–195°C): Amino acids and sugars recombine into 800+ volatile aromatics—roasted hazelnut, toffee, and cocoa.\n3. First Crack (~196°C–202°C): Internal steam pressure fractures cell walls with an audible snap. Controlling the post-crack Development Time Ratio (15–22%) lets ROAR roasters tune crisp brightness or velvet espresso body.',
      author: 'ROAR Head Roaster',
      readMinutes: 6,
      imageKey: 'product_roasting_drum_clean',
    },
    {
      slug: 'nhan-dien-ca-phe-rang-moc-100-phan-tram',
      category: 'Coffee knowledge',
      tags: ['Rang mộc', 'Nguyên chất', 'Sức khỏe', 'Kiến thức'],
      titleVi: '4 Dấu Hiệu Nhận Biết Cà Phê Rang Mộc 100% Không Tẩm Bơ Hóa Chất',
      titleEn: '4 Signs of 100% Pure Roasted Coffee With Zero Artificial Additives',
      excerptVi: 'Từ độ tơi nhẹ của bột khô, lớp bọt tự nhiên khi rót nước sôi đến cảm giác thanh nhẹ ở cổ họng sau khi uống.',
      excerptEn: 'From dry powder lightness and natural bloom foam to clean aftertaste without sticky chemical residue.',
      contentVi:
        'Người tiêu dùng thông thái ngày càng ưu tiên cà phê rang mộc nguyên chất để bảo vệ sức khỏe và cảm nhận đúng hương vị tự nhiên của hạt. Dưới đây là 4 cách kiểm chứng trực quan:\n\n1. Thể tích & Độ tơi của bột: Cà phê nguyên chất 100% nở phồng gấp đôi sau khi rang nên 250g bột rang mộc trông đầy túi, bột tơi xốp và không bị vón cục bết dầu dính tay.\n2. Phản ứng Bloom với nước nóng: Khi châm nước 92–95°C, bột cà phê rang mới sủi bọt CO2 mịn đều và nở phồng tự nhiên, không chìm ngay hay tạo bọt xà phòng lâu tan.\n3. Màu sắc & Độ trong của nước cốt: Cà phê nguyên chất có màu nâu cánh gián đến nâu hổ phách trong trẻo khi soi dưới ánh sáng, không đen kịt đặc quánh như nước màu.\n4. Hương thơm tự nhiên: Dịu nhẹ mùi cacao, hạt rang và thoang thoảng hoa trái thay vì mùi hương liệu hóa học sực nức bám lâu trên ly rỗng.',
      contentEn:
        'Discerning drinkers increasingly demand 100% pure coffee free of roasted corn, soy, butter glazing, or synthetic flavoring. Look for four clear indicators:\n\n1. Loft & Dry Texture: Pure roasted coffee doubles in volume during roasting—grounds stay fluffy and dry, never clumping into oily paste.\n2. Natural Bloom Foam: Fresh 100% coffee fizzes smoothly as CO2 escapes at 92–95°C rather than collapsing immediately or forming soap-like bubbles.\n3. Translucent Amber-Brown Liquor: Held to light, pure black coffee gleams deep chestnut amber rather than opaque pitch-black.\n4. Clean Aromatic Decay: Genuine cocoa, toasted nut, and fruit notes fade gracefully in an empty cup rather than clinging like perfume.',
      author: 'ROAR Quality Assurance',
      readMinutes: 5,
      imageKey: 'journal_tasting_archetypes',
    },
    // +2 New Articles for 'Coffee origins'
    {
      slug: 'tho-nhuong-dat-do-bazan-dak-lak-va-dak-nong',
      category: 'Coffee origins',
      tags: ['Đắk Lắk', 'Đắk Nông', 'Bazan', 'Robusta'],
      titleVi: 'Đất Đỏ Bazan Tây Nguyên (Đắk Lắk – Đắk Nông): Nền Tảng Tạo Nên Robusta Đậm Sánh',
      titleEn: 'Red Basalt Highlands (Đắk Lắk & Đắk Nông): The Soil Behind Bold Vietnamese Robusta',
      excerptVi: 'Lớp đất núi lửa phong hóa sâu giàu khoáng chất sắt, kali cùng nắng gió cao nguyên tạo nên hàm lượng đường và thể chất khó nơi nào sánh bằng.',
      excerptEn: 'Mineral-rich volcanic soils combined with dry harvest seasons produce unmatched Robusta body, sweetness, and espresso crema.',
      contentVi:
        'Nếu Cầu Đất là thánh địa của Arabica hương hoa, thì dải cao nguyên Buôn Ma Thuột – Krông Năng (Đắk Lắk) nối dài sang Đắk Mil (Đắk Nông) chính là trái tim của Robusta Việt Nam. Tầng đất đỏ bazan hình thành từ hoạt động núi lửa cổ đại có độ xốp cao, thoát nước tốt và giàu khoáng chất vi lượng.\n\nĐặc biệt, mùa thu hoạch rộ từ tháng 11 đến tháng 1 trùng khớp hoàn toàn với mùa khô nắng ráo và gió đông bắc ổn định, tạo điều kiện lý tưởng để phơi giàn Natural và Honey mà không bị nấm mốc.\n\nĐó là lý do những lô Robusta S18 và Culi tuyển chọn từ Đắk Lắk luôn mang vị sô-cô-la đen đậm đà, độ sánh cao và lớp crema vàng óng đặc trưng trong các dòng sản phẩm ROAR COFFEE®.',
      contentEn:
        'While Cầu Đất anchors Vietnam’s floral Arabica reputation, the volcanic plateaus stretching from Buôn Ma Thuột and Krông Năng (Đắk Lắk) into Đắk Mil (Đắk Nông) form the beating heart of Vietnamese Robusta.\n\nDeep weathered red basalt offers natural drainage and rich iron-potassium mineralogy. Crucially, the November–January harvest aligns with dry upland sunshine and crisp winds—ideal for spotless raised-bed Natural and Honey drying.\n\nThat synergy explains why ROAR COFFEE® Đắk Lắk Robusta S18 and Culi lots deliver such velvety dark chocolate body and dense espresso crema.',
      author: 'ROAR Sourcing Team',
      readMinutes: 5,
      imageKey: 'origin_central_highlands',
    },
    {
      slug: 'arabica-tay-bac-son-la-dien-bien-va-mang-den',
      category: 'Coffee origins',
      tags: ['Sơn La', 'Điện Biên', 'Măng Đen', 'Arabica'],
      titleVi: 'Sơn La, Điện Biên & Măng Đen: Hành Trình Khám Phá Những Tiểu Vùng Arabica Núi Cao',
      titleEn: 'Sơn La, Điện Biên & Măng Đen: Exploring Vietnam’s Rising High-Altitude Arabica Terroirs',
      excerptVi: 'Ngoài Cầu Đất trứ danh, các triền núi lạnh giá phía Bắc và Măng Đen (Kon Tum) đang ghi dấu ấn với hương quả hạch, đường mía và cam chín.',
      excerptEn: 'Beyond Cầu Đất, cool northern mountain slopes and Măng Đen (Kon Tum) are crafting expressive Arabica lots with stone fruit and cane sweetness.',
      contentVi:
        'Bản đồ Arabica Việt Nam đang mở rộng đầy thú vị vượt ra khỏi ranh giới Đà Lạt. Nhờ hệ thống sườn núi đá vôi và khí hậu mùa đông se lạnh rõ rệt, ba tiểu vùng sau đang trở thành tâm điểm của giới rang xay:\n\n• Sơn La (Chiềng Ban – Mai Sơn · 900–1.300m): Cho hạt Arabica Catimor có vị ngọt đường mía rất rõ, hậu vị hạt mắc-ca rang và độ chua dịu êm.\n• Mường Ảng (Điện Biên): Thời tiết khắc nghiệt hơn giúp mật độ hạt cứng chắc, dậy hương mận chín và cacao sữa khi rang Medium.\n• Măng Đen (Kon Tum · 1.200m): Được mệnh danh là "Đà Lạt thứ hai" của Bắc Tây Nguyên với rừng thông mát lành, cho tách Arabica thơm hương cam thảo và hoa rừng đặc sắc.',
      contentEn:
        'Vietnam’s specialty Arabica map reaches far beyond Đà Lạt. Cool highland winters and dramatic elevation slopes are putting three distinctive micro-regions on roasters’ radars:\n\n• Sơn La (Chiềng Ban & Mai Sơn · 900–1,300m): Distinct cane-sugar sweetness, toasted macadamia body, and gentle citrus acidity.\n• Mường Ảng (Điện Biên): Crisp winter nights yield dense Catimor beans bursting with ripe plum and milk chocolate.\n• Măng Đen (Kon Tum · 1,200m): Misty pine plateaus producing aromatic Arabica lots with wildflower lift and sweet licorice finish.',
      author: 'ROAR Origins Research',
      readMinutes: 6,
      imageKey: 'journal_caudat_arabica',
    },
  ];

  const checkJournal = db.prepare('SELECT id FROM journal_articles WHERE slug = ?');
  const insertJournal = db.prepare(`
    INSERT INTO journal_articles (slug, category, tags_json, title_vi, title_en, excerpt_vi, excerpt_en, content_vi, content_en, author, read_minutes, image_key, published)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);
  for (const a of extraJournalArticles) {
    if (!checkJournal.get(a.slug)) {
      insertJournal.run(
        a.slug,
        a.category,
        JSON.stringify(a.tags),
        a.titleVi,
        a.titleEn,
        a.excerptVi,
        a.excerptEn,
        a.contentVi,
        a.contentEn,
        a.author,
        a.readMinutes,
        a.imageKey
      );
    }
  }
}

export function logAudit(
  actorUserId: number | null,
  actorEmail: string,
  action: string,
  entityType: string,
  entityId: string | number,
  details: unknown = {}
): void {
  db.prepare(`
    INSERT INTO audit_logs (actor_user_id, actor_email, action, entity_type, entity_id, details_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(actorUserId, actorEmail, action, entityType, String(entityId), JSON.stringify(details));
}

const VIETNAM_COFFEE_ORIGINS = [
  {
    slug: 'dak-lak',
    region_name_vi: 'Đắk Lắk',
    region_name_en: 'Đắk Lắk',
    localities_vi: 'Buôn Ma Thuột, Cư M’gar, Krông Pắc, Krông Năng, Ea H’leo, Buôn Hồ',
    localities_en: 'Buôn Ma Thuột, Cư M’gar, Krông Pắc, Krông Năng, Ea H’leo, Buôn Hồ',
    elevation: '450m – 800m',
    varieties: 'Robusta (Vối, TR4, TR9), Culi (Peaberry)',
    processing_methods: 'Natural, Honey, Washed (CBU)',
    sourcing_status: 'confirmed_sourcing',
    characteristics_vi:
      'Thủ phủ cà phê lớn nhất Việt Nam trên nền đất đỏ bazan màu mỡ (diện tích >210.000 ha), mùa thu hoạch rộ từ tháng 11 – tháng 1, cho hạt Robusta chắc nặng, hàm lượng caffeine cao và hậu vị sô-cô-la đậm.',
    characteristics_en:
      'Vietnam’s largest coffee capital across deep red basaltic plateaus (>210,000 ha), harvested Nov–Jan for dense Robusta and Culi beans with rich cocoa body.',
    sourcing_note_vi: 'Khu vực thu mua trọng tâm & đánh giá chất lượng trực tiếp cho Robusta House Blend và Culi/Robusta nhân xanh.',
    sourcing_note_en: 'Primary ROAR COFFEE sourcing evaluation zone for Robusta House Blend and commercial Robusta/Culi lots.',
    map_x: 268,
    map_y: 462,
    latitude: 12.6667,
    longitude: 108.05,
    image_key: 'origin_central_highlands',
    photo_attribution: 'Buôn Ma Thuột & Cư M’gar, Đắk Lắk — Vùng đất đỏ bazan Tây Nguyên',
    related_skus: ['RO-S18-NAT', 'RO-S18-HON', 'RO-S18-CBU', 'RC-RST-RHB'],
  },
  {
    slug: 'lam-dong',
    region_name_vi: 'Lâm Đồng',
    region_name_en: 'Lâm Đồng',
    localities_vi: 'Cầu Đất (Xuân Trường, Trạm Hành), Đà Lạt, Lạc Dương, Di Linh, Bảo Lộc, Lâm Hà',
    localities_en: 'Cầu Đất (Xuân Trường, Trạm Hành), Đà Lạt, Lạc Dương, Di Linh, Bảo Lộc, Lâm Hà',
    elevation: '900m – 1,650m',
    varieties: 'Arabica (Catimor, Bourbon, Typica, Catuai), Robusta',
    processing_methods: 'Washed (CBU), Honey, Natural',
    sourcing_status: 'confirmed_sourcing',
    characteristics_vi:
      'Cao nguyên Langbiang & Di Linh có khí hậu ôn hòa, sương mù buổi sớm quanh năm. Cầu Đất (>1.500m) nổi tiếng với Arabica thanh lịch, trong khi Di Linh – Bảo Lộc cung ứng nguồn Robusta độ cao lớn.',
    characteristics_en:
      'High-altitude temperate belt uniting Cầu Đất & Đà Lạt (>1,500m) specialty Arabica terraces with highland Robusta valleys across Di Linh and Bảo Lộc.',
    sourcing_note_vi: 'Vùng nguyên liệu trọng tâm cho Arabica Selection, Espresso Gold và các lô nhân xanh chế biến ướt CBU.',
    sourcing_note_en: 'Primary sourcing zone for Arabica Selection, Espresso Gold, and Washed (CBU) green lots.',
    map_x: 262,
    map_y: 512,
    latitude: 11.9404,
    longitude: 108.4583,
    image_key: 'hero_highland_harvest_banner',
    photo_attribution: 'Cầu Đất – Đà Lạt & Di Linh, Lâm Đồng — Vùng Arabica cao nguyên',
    related_skus: ['AR-S16-CBU', 'AR-S18-CBU', 'AR-S16-HON', 'RC-RST-ARS', 'RC-RST-ESG'],
  },
  {
    slug: 'gia-lai',
    region_name_vi: 'Gia Lai',
    region_name_en: 'Gia Lai',
    localities_vi: 'Pleiku, Ia Grai, Chư Prông, Đak Đoa, Chư Sê, Mang Yang',
    localities_en: 'Pleiku, Ia Grai, Chư Prông, Đak Đoa, Chư Sê, Mang Yang',
    elevation: '650m – 850m',
    varieties: 'Robusta, Culi (Peaberry), Arabica (Mang Yang)',
    processing_methods: 'Natural, Honey, Washed (CBU)',
    sourcing_status: 'general_geography',
    characteristics_vi:
      'Cao nguyên Pleiku rộng lớn đứng thứ ba cả nước về sản lượng cà phê, mùa khô nắng gió ổn định từ tháng 11 – tháng 3 rất lý tưởng để phơi giàn Natural và Honey sạch vị.',
    characteristics_en:
      'Expansive Pleiku basalt plateau ranking among Vietnam’s top three producing provinces, blessed with dry winter sunshine ideal for clean raised-bed drying.',
    sourcing_note_vi: 'Địa lý vùng cà phê Việt Nam — Nguồn tham khảo cho các lô Robusta & Culi phơi giàn (xác thực theo từng hợp đồng).',
    sourcing_note_en: 'Vietnamese coffee geography profile — Reference belt for raised-bed Natural & Honey Robusta/Culi lots.',
    map_x: 260,
    map_y: 415,
    latitude: 13.9833,
    longitude: 108.0,
    image_key: 'origin_central_highlands',
    photo_attribution: 'Pleiku & Ia Grai, Gia Lai — Cao nguyên Bắc Tây Nguyên',
    related_skus: ['RO-S16-NAT', 'RO-S18-HON', 'CU-S16-HON'],
  },
  {
    slug: 'dak-nong',
    region_name_vi: 'Đắk Nông',
    region_name_en: 'Đắk Nông',
    localities_vi: 'Gia Nghĩa, Đắk Mil, Đắk Song, Đắk R’lấp, Tuy Đức',
    localities_en: 'Gia Nghĩa, Đắk Mil, Đắk Song, Đắk R’lấp, Tuy Đức',
    elevation: '600m – 950m',
    varieties: 'Robusta, Culi (Peaberry)',
    processing_methods: 'Natural, Honey, Washed (CBU)',
    sourcing_status: 'general_geography',
    characteristics_vi:
      'Cao nguyên M’Nông chuyển tiếp nằm ở phía Tây Nam Tây Nguyên (đặc biệt cụm Đắk Mil – Đắk Song), chênh lệch nhiệt độ đêm mát giúp quả cà phê chín chậm và phát triển vị ngọt tự nhiên.',
    characteristics_en:
      'Southern Central Highlands M’Nông plateau (especially Đắk Mil and Đắk Song), where cooler highland nights slow cherry maturation and deepen sweetness.',
    sourcing_note_vi: 'Địa lý vùng cà phê Việt Nam — Vùng Robusta cao độ nổi bật cho sản phẩm rang đậm và Signature Reserve.',
    sourcing_note_en: 'Vietnamese coffee geography profile — Notable high-elevation Robusta belt.',
    map_x: 244,
    map_y: 492,
    latitude: 12.0033,
    longitude: 107.6876,
    image_key: 'hero_highland_harvest_banner',
    photo_attribution: 'Đắk Mil & Gia Nghĩa, Đắk Nông — Cao nguyên M’Nông',
    related_skus: ['RO-S18-NAT', 'CU-S18-NAT', 'RO-S16-HON'],
  },
  {
    slug: 'kon-tum',
    region_name_vi: 'Kon Tum',
    region_name_en: 'Kon Tum',
    localities_vi: 'Đắk Hà, Măng Đen (Kon Plông), Đắk Tô, Tu Mơ Rông, Ngọc Hồi',
    localities_en: 'Đắk Hà, Măng Đen (Kon Plông), Đắk Tô, Tu Mơ Rông, Ngọc Hồi',
    elevation: '600m – 1,250m',
    varieties: 'Robusta (Đắk Hà), Arabica Catimor (Măng Đen)',
    processing_methods: 'Washed (CBU), Honey, Natural',
    sourcing_status: 'general_geography',
    characteristics_vi:
      'Vùng cực Bắc Tây Nguyên hội tụ hai tiểu vùng đặc sắc: thung lũng bazan Đắk Hà nổi tiếng với chỉ dẫn địa lý Cà phê Đắk Hà (Robusta) và vùng khí hậu lạnh Măng Đen (>1.100m) trồng Arabica xứ lạnh.',
    characteristics_en:
      'Northernmost Central Highlands uniting the Đắk Hà GI Robusta valley with Măng Đen’s cool misty (>1,100m) mountain terraces suited to Arabica cultivation.',
    sourcing_note_vi: 'Địa lý vùng cà phê Việt Nam — Khu vực Bắc Tây Nguyên đa dạng cả Robusta Đắk Hà lẫn Arabica Măng Đen.',
    sourcing_note_en: 'Vietnamese coffee geography profile — Dual-species belt spanning Đắk Hà Robusta and Măng Đen Arabica.',
    map_x: 256,
    map_y: 386,
    latitude: 14.5425,
    longitude: 107.9219,
    image_key: 'origin_central_highlands',
    photo_attribution: 'Đắk Hà & Măng Đen, Kon Tum — Cực Bắc Tây Nguyên',
    related_skus: ['RO-S16-CBU', 'AR-S16-HON', 'RC-RST-ESP'],
  },
  {
    slug: 'son-la',
    region_name_vi: 'Sơn La',
    region_name_en: 'Sơn La',
    localities_vi: 'Mai Sơn, Chiềng Ban, Thuận Châu, Sốp Cộp, Yên Châu, Mường Chanh',
    localities_en: 'Mai Sơn, Chiềng Ban, Thuận Châu, Sốp Cộp, Yên Châu, Mường Chanh',
    elevation: '900m – 1,250m',
    varieties: 'Arabica Catimor, THA1',
    processing_methods: 'Washed (CBU), Honey',
    sourcing_status: 'general_geography',
    characteristics_vi:
      'Vùng trồng Arabica lớn nhất miền Bắc (~20.000 ha) trải dài trên các sườn núi đá vôi Mai Sơn – Thuận Châu, khí hậu mùa đông se lạnh tạo hương thơm hoa quả rõ nét khi chế biến ướt CBU.',
    characteristics_en:
      'Northern Vietnam’s largest Arabica hub (~20,000 ha) across Mai Sơn and Thuận Châu limestone ridges, where crisp winters sharpen floral acidity under CBU washing.',
    sourcing_note_vi: 'Địa lý vùng cà phê Việt Nam — Vùng Arabica trọng điểm khu vực Tây Bắc.',
    sourcing_note_en: 'Vietnamese coffee geography profile — Primary Northwest Vietnam Arabica region.',
    map_x: 138,
    map_y: 126,
    latitude: 21.3256,
    longitude: 103.9188,
    image_key: 'hero_highland_harvest_banner',
    photo_attribution: 'Chiềng Ban – Mai Sơn, Sơn La — Thủ phủ Arabica Tây Bắc',
    related_skus: ['AR-S14-CBU', 'AR-S16-CBU', 'AR-S18-CBU'],
  },
  {
    slug: 'dien-bien',
    region_name_vi: 'Điện Biên',
    region_name_en: 'Điện Biên',
    localities_vi: 'Mường Ảng, Tuần Giáo, Điện Biên Đông, Mường Nhé',
    localities_en: 'Mường Ảng, Tuần Giáo, Điện Biên Đông, Mường Nhé',
    elevation: '800m – 1,200m',
    varieties: 'Arabica Catimor',
    processing_methods: 'Washed (CBU), Natural',
    sourcing_status: 'general_geography',
    characteristics_vi:
      'Tâm điểm tại thung lũng Mường Ảng và Tuần Giáo — nơi cây Arabica được trồng lâu đời trên dãy núi cao Tây Bắc với biên độ nhiệt ngày – đêm lớn, thu hoạch muộn từ tháng 11 đến tháng 2.',
    characteristics_en:
      'Centered in Mường Ảng and Tuần Giáo mountain valleys, a historic Northwest Arabica enclave shaped by wide diurnal swings and late-season harvests.',
    sourcing_note_vi: 'Địa lý vùng cà phê Việt Nam — Tiểu vùng Arabica núi cao Tây Bắc (Mường Ảng).',
    sourcing_note_en: 'Vietnamese coffee geography profile — Northwest highland Arabica enclave (Mường Ảng).',
    map_x: 112,
    map_y: 102,
    latitude: 21.5244,
    longitude: 103.2189,
    image_key: 'origin_central_highlands',
    photo_attribution: 'Mường Ảng & Tuần Giáo, Điện Biên — Vùng núi cao Tây Bắc',
    related_skus: ['AR-S14-CBU', 'AR-S16-NAT'],
  },
  {
    slug: 'quang-tri',
    region_name_vi: 'Quảng Trị',
    region_name_en: 'Quảng Trị',
    localities_vi: 'Khe Sanh, Hướng Hóa, Hướng Phùng, Tân Hợp, Hướng Linh',
    localities_en: 'Khe Sanh, Hướng Hóa, Hướng Phùng, Tân Hợp, Hướng Linh',
    elevation: '500m – 800m',
    varieties: 'Arabica Catimor, Liberica (Cà phê Mít)',
    processing_methods: 'Washed (CBU), Honey, Natural',
    sourcing_status: 'general_geography',
    characteristics_vi:
      'Vùng cà phê Arabica nổi tiếng miền Trung tại cao nguyên Khe Sanh – Hướng Hóa (dãy Trường Sơn), kết hợp thổ nhưỡng đất đỏ trên sườn đồi và khí hậu chuyển tiếp giữa hai mùa gió Bắc – Nam.',
    characteristics_en:
      'Central Vietnam’s celebrated Khe Sanh – Hướng Hóa Arabica hills along the Trường Sơn range, bridging basalt foothill soils with distinct monsoon microclimates.',
    sourcing_note_vi: 'Địa lý vùng cà phê Việt Nam — Vùng Arabica Khe Sanh tiêu biểu miền Trung.',
    sourcing_note_en: 'Vietnamese coffee geography profile — Landmark Central Vietnam Khe Sanh Arabica region.',
    map_x: 204,
    map_y: 288,
    latitude: 16.6231,
    longitude: 106.7267,
    image_key: 'product_green_coffee_beans',
    photo_attribution: 'Khe Sanh – Hướng Hóa, Quảng Trị — Arabica dãy Trường Sơn',
    related_skus: ['AR-S16-CBU', 'AR-S16-HON'],
  },
  {
    slug: 'nghe-an',
    region_name_vi: 'Nghệ An (Phủ Quỳ)',
    region_name_en: 'Nghệ An (Phủ Quỳ)',
    localities_vi: 'Phủ Quỳ, Nghĩa Đàn, Quỳ Hợp, Thái Hòa, Tân Kỳ',
    localities_en: 'Phủ Quỳ, Nghĩa Đàn, Quỳ Hợp, Thái Hòa, Tân Kỳ',
    elevation: '150m – 450m',
    varieties: 'Arabica, Robusta',
    processing_methods: 'Washed (CBU), Natural',
    sourcing_status: 'general_geography',
    characteristics_vi:
      'Vùng đất đỏ bazan Phủ Quỳ mang dấu ấn lịch sử lâu đời bậc nhất của ngành cà phê Việt Nam từ đầu thế kỷ 20, thích nghi đa dạng với cả dòng Arabica lẫn Robusta vùng Bắc Trung Bộ.',
    characteristics_en:
      'Historic early-20th-century Phủ Quỳ red-basalt plateau in North Central Vietnam cultivating both Arabica and Robusta on rolling mid-elevation terrain.',
    sourcing_note_vi: 'Địa lý vùng cà phê Việt Nam — Vùng nguyên liệu lịch sử Bắc Trung Bộ (Phủ Quỳ).',
    sourcing_note_en: 'Vietnamese coffee geography profile — Historic Phủ Quỳ basalt coffee plateau.',
    map_x: 166,
    map_y: 206,
    latitude: 19.3219,
    longitude: 105.4242,
    image_key: 'product_roasting_drum_clean',
    photo_attribution: 'Phủ Quỳ – Nghĩa Đàn, Nghệ An — Vùng cà phê Bắc Trung Bộ',
    related_skus: ['AR-S14-CBU', 'RO-S14-NAT'],
  },
  {
    slug: 'dong-nai',
    region_name_vi: 'Đồng Nai & Đông Nam Bộ',
    region_name_en: 'Đồng Nai & Southeast',
    localities_vi: 'Long Khánh, Xuân Lộc, Cẩm Mỹ, Châu Đức (Bà Rịa – Vũng Tàu)',
    localities_en: 'Long Khánh, Xuân Lộc, Cẩm Mỹ, Châu Đức (Bà Rịa – Vũng Tàu)',
    elevation: '100m – 350m',
    varieties: 'Robusta, Liberica / Excelsa (Cà phê Mít)',
    processing_methods: 'Natural, Honey',
    sourcing_status: 'general_geography',
    characteristics_vi:
      'Vùng trồng cà phê chuyển tiếp phía Nam gần các cảng xuất khẩu TP.HCM – Cái Mép, thu hoạch sớm (từ cuối tháng 10) với nguồn Robusta vùng thấp và đặc sản Cà phê Mít (Excelsa/Liberica).',
    characteristics_en:
      'Southern lowland basalt belt near HCMC & Cái Mép export ports, yielding early-harvest Robusta and heritage Liberica/Excelsa (Cà phê Mít).',
    sourcing_note_vi: 'Địa lý vùng cà phê Việt Nam — Vùng cửa ngõ Đông Nam Bộ thuận lợi logistics cảng biển.',
    sourcing_note_en: 'Vietnamese coffee geography profile — Southeast export corridor near deep-water ports.',
    map_x: 244,
    map_y: 552,
    latitude: 10.9284,
    longitude: 107.2429,
    image_key: 'product_green_coffee_beans',
    photo_attribution: 'Long Khánh – Xuân Lộc, Đồng Nai & Đông Nam Bộ',
    related_skus: ['RO-S16-NAT', 'RO-S14-NAT'],
  },
];

function runIncrementalMigrations(): void {
  // 1. Ensure ROAR COFFEE ESPRESSO (RC-RST-ESP) and ROAR COFFEE ESPRESSO GOLD (RC-RST-ESG) are separate SKUs
  const combinedEsg = db.prepare("SELECT * FROM products WHERE slug = 'roar-espresso-gold'").get() as any;
  const separateEsp = db.prepare("SELECT * FROM products WHERE slug = 'roar-espresso'").get() as any;

  if (combinedEsg && String(combinedEsg.name_en || '').includes('ESPRESSO & ESPRESSO GOLD')) {
    db.prepare(`
      UPDATE products SET
        name_vi = ?,
        name_en = ?,
        subtitle_vi = ?,
        subtitle_en = ?,
        description_vi = ?,
        description_en = ?,
        coffee_type = ?,
        blend_summary_vi = ?,
        blend_summary_en = ?,
        roast_profile_vi = ?,
        roast_profile_en = ?,
        tasting_notes_vi = ?,
        tasting_notes_en = ?,
        variants_json = ?,
        packaging_options_json = ?,
        price_vnd = ?,
        price_usd = ?,
        mascot_slug = 'eagle',
        screen_size = 'S18 Selected',
        processing_method = 'CBU / Washed & Honey',
        origin_region = 'Lâm Đồng & Đắk Lắk',
        grading_spec = 'ROAR Espresso Gold Standard',
        image_key = 'hero_signature_reserve_banner'
      WHERE slug = 'roar-espresso-gold'
    `).run(
      'ROAR COFFEE ESPRESSO GOLD',
      'ROAR COFFEE ESPRESSO GOLD',
      'Cá tính Đại Bàng (Eagle) · Tầm nhìn, tham vọng, bứt phá',
      'Eagle Character · Vision, Ambition, Excellence',
      'Phiên bản Espresso Gold cao cấp gắn với hình tượng Đại Bàng — đại diện cho khát vọng bứt phá và tiêu chuẩn chiết xuất khắt khe tại các quầy pha chế chuyên nghiệp và chuỗi HORECA.',
      'Elevated Espresso Gold edition anchored by the Eagle character — celebrating international vision, elevated hospitality standards, and high-clarity espresso extraction.',
      'Premium Espresso Gold Blend',
      'Công thức Espresso Gold tuyển chọn (Tỷ lệ chi tiết bảo mật)',
      'Selected Espresso Gold formulation (Confidential proportions)',
      'Rang Espresso Gold tinh chỉnh',
      'Precision Espresso Gold Roast',
      'Chiết xuất dày mượt 18g → 36g ở 90–94°C · Cập nhật thử nếm theo từng lô phát hành',
      'Dense, velvety 18g → 36g extraction at 90–94°C · Cupping notes updated per verified lot',
      JSON.stringify([
        { label: '250g · Whole Bean (Gold)', priceVnd: 235000, priceUsd: 9.5 },
        { label: '500g · Whole Bean (Gold)', priceVnd: 440000, priceUsd: 17.8 },
        { label: '1kg · HORECA Gold Pack', priceVnd: 840000, priceUsd: 34.0 },
      ]),
      JSON.stringify(['250g', '500g', '1kg']),
      235000,
      9.5
    );
  }

  if (!separateEsp) {
    db.prepare(`
      INSERT INTO products (
        slug, sku, category, sub_category, name_vi, name_en, subtitle_vi, subtitle_en,
        description_vi, description_en, coffee_type, blend_summary_vi, blend_summary_en, blend_public,
        roast_profile_vi, roast_profile_en, tasting_notes_vi, tasting_notes_en,
        brewing_methods_json, variants_json, packaging_options_json,
        price_vnd, price_usd, inventory, moq, status, is_demo_data,
        mascot_slug, screen_size, processing_method, origin_region,
        harvest_year, moisture_content, density, defect_info, grading_spec, image_key, featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'roar-espresso',
      'RC-RST-ESP',
      'roasted',
      'Personality Line',
      'ROAR COFFEE ESPRESSO',
      'ROAR COFFEE ESPRESSO',
      'Cá tính Cáo (Fox) · Thông minh, linh hoạt, sáng tạo',
      'Fox Character · Intelligence, Agility, Creativity',
      'Dòng cà phê rang xay chuyên biệt cho máy pha Espresso hiện đại và pha phin tinh chỉnh, gắn với hình tượng Cáo — biểu trưng cho tư duy linh hoạt, sự chính xác và sáng tạo mỗi ngày.',
      'Dedicated roasted blend engineered for modern espresso bars and agile daily extraction, embodied by the Fox — representing sharp intellect, agility, and creative craft.',
      'Proprietary Espresso Blend',
      'Công thức phối trộn Espresso chuẩn cân bằng (Tỷ lệ chi tiết bảo mật)',
      'Balanced Espresso formulation (Confidential blend percentages)',
      0,
      'Rang Espresso vừa-đậm (Medium-Dark Espresso)',
      'Medium-Dark Espresso Roast',
      'Crema ổn định, cân bằng cho Espresso 18g → 36g · Ghi chú hương vị cập nhật theo lô xác thực',
      'Stable crema balanced for 18g → 36g extraction · Verified cupping notes per batch',
      JSON.stringify(['Espresso', 'Moka Pot', 'Cold Brew']),
      JSON.stringify([
        { label: '250g · Whole Bean', priceVnd: 195000, priceUsd: 7.9 },
        { label: '250g · Espresso Fine Ground', priceVnd: 195000, priceUsd: 7.9 },
        { label: '500g · Whole Bean', priceVnd: 380000, priceUsd: 15.5 },
        { label: '1kg · Barista Pack', priceVnd: 720000, priceUsd: 29.0 },
      ]),
      JSON.stringify(['250g', '500g', '1kg']),
      195000,
      7.9,
      88,
      '1 bag (Demo)',
      'active',
      1,
      'fox',
      'S16/S18',
      'Configurable',
      'Tây Nguyên (Đắk Lắk & Lâm Đồng)',
      'Pending verified lot',
      'N/A (Roasted)',
      'N/A (Roasted)',
      'Confidential',
      'ROAR Espresso Standard',
      'product_arabica_selection',
      1
    );
  }

  // Update Fox personality to link directly to separate roar-espresso SKU
  db.prepare(`
    UPDATE personalities
    SET product_association_vi = 'ROAR COFFEE ESPRESSO',
        product_association_en = 'ROAR COFFEE ESPRESSO',
        associated_product_slug = 'roar-espresso'
    WHERE slug = 'fox' AND associated_product_slug != 'roar-espresso'
  `).run();

  // 2. Backfill any missing Vietnamese coffee growing regions without overwriting CMS customizations
  const upsertOrigin = db.prepare(`
    INSERT OR IGNORE INTO coffee_origins (
      slug, region_name_vi, region_name_en, localities_vi, localities_en,
      elevation, varieties, processing_methods, sourcing_status,
      characteristics_vi, characteristics_en, sourcing_note_vi, sourcing_note_en,
      map_x, map_y, latitude, longitude, image_key, photo_attribution, related_skus_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const o of VIETNAM_COFFEE_ORIGINS) {
    upsertOrigin.run(
      o.slug,
      o.region_name_vi,
      o.region_name_en,
      o.localities_vi,
      o.localities_en,
      o.elevation,
      o.varieties,
      o.processing_methods,
      o.sourcing_status,
      o.characteristics_vi,
      o.characteristics_en,
      o.sourcing_note_vi,
      o.sourcing_note_en,
      o.map_x,
      o.map_y,
      o.latitude,
      o.longitude,
      o.image_key,
      o.photo_attribution,
      JSON.stringify(o.related_skus)
    );
  }

  // 3. Ensure products.gallery_images_json exists for multi-image WooCommerce galleries
  const cols = db.prepare('PRAGMA table_info(products)').all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === 'gallery_images_json')) {
    db.exec("ALTER TABLE products ADD COLUMN gallery_images_json TEXT NOT NULL DEFAULT '[]'");
  }

  // 4. Seed expanded promotions idempotently
  const extraPromos = [
    {
      code: 'ROARESPRESSO50',
      title_vi: 'Giảm 50.000đ Dòng Espresso & Espresso Gold',
      title_en: '50,000 VND Off Espresso & Espresso Gold',
      description_vi: 'Ưu đãi trực tiếp 50.000đ cho đơn hàng dòng ROAR Espresso hoặc Espresso Gold từ 350.000đ.',
      description_en: 'Instant 50,000 VND discount on ROAR Espresso or Espresso Gold orders from 350,000 VND.',
      promo_type: 'product_line',
      discount_type: 'fixed',
      discount_value: 50000,
      max_discount: 50000,
      min_order_value: 350000,
      eligible_category: 'roasted',
      start_date: '2026-01-01',
      end_date: '2027-12-31',
      usage_limit: 800,
      member_only: 0,
      min_tier: '',
      terms_vi: 'Áp dụng cho đơn hàng cà phê rang xay từ 350.000đ.',
      terms_en: 'Valid on roasted coffee orders from 350,000 VND.',
    },
    {
      code: 'HOATAN20',
      title_vi: 'Ưu Đãi Cà Phê Hòa Tan Silver & Gold — Giảm 20%',
      title_en: 'Instant Coffee Silver & Gold — 20% Off',
      description_vi: 'Giảm 20% (tối đa 80.000đ) khi trải nghiệm bộ sưu tập Cà phê Hòa tan tiện lợi ROAR COFFEE.',
      description_en: 'Enjoy 20% off (up to 80,000 VND) across Instant Silver & Gold collections.',
      promo_type: 'flash_offer',
      discount_type: 'percent',
      discount_value: 20,
      max_discount: 80000,
      min_order_value: 180000,
      eligible_category: 'instant',
      start_date: '2026-01-01',
      end_date: '2027-12-31',
      usage_limit: 600,
      member_only: 0,
      min_tier: '',
      terms_vi: 'Áp dụng cho dòng Cà phê Hòa tan Silver & Gold từ 180.000đ.',
      terms_en: 'Applicable to Instant Silver & Gold from 180,000 VND.',
    },
    {
      code: 'THANHVIEN15',
      title_vi: 'Đặc Quyền Thành Viên — Giảm 15% Mọi Dòng Rang Xay',
      title_en: 'Member Exclusive — 15% Off Roasted Coffee',
      description_vi: 'Ưu đãi dành cho toàn bộ tài khoản thành viên ROAR COFFEE đã đăng nhập với đơn từ 250.000đ.',
      description_en: 'Exclusive 15% savings for signed-in ROAR COFFEE Members on roasted orders over 250,000 VND.',
      promo_type: 'member_only',
      discount_type: 'percent',
      discount_value: 15,
      max_discount: 180000,
      min_order_value: 250000,
      eligible_category: 'roasted',
      start_date: '2026-01-01',
      end_date: '2027-12-31',
      usage_limit: 1200,
      member_only: 1,
      min_tier: 'ROAR Member',
      terms_vi: 'Yêu cầu đăng nhập tài khoản thành viên ROAR COFFEE.',
      terms_en: 'Requires signed-in ROAR COFFEE member account.',
    },
    {
      code: 'DOANHGIA12',
      title_vi: 'Quà Tặng Doanh Nghiệp & Đơn Lớn — Giảm 12%',
      title_en: 'Corporate Gifting & Bulk Retail — 12% Off',
      description_vi: 'Giảm 12% (tối đa 350.000đ) cho đơn hàng hộp quà tặng hoặc đơn bán lẻ giá trị cao từ 1.000.000đ.',
      description_en: 'Save 12% (up to 350,000 VND) on presentation gift sets and orders from 1,000,000 VND.',
      promo_type: 'gifting',
      discount_type: 'percent',
      discount_value: 12,
      max_discount: 350000,
      min_order_value: 1000000,
      eligible_category: 'all',
      start_date: '2026-01-01',
      end_date: '2027-12-31',
      usage_limit: 400,
      member_only: 0,
      min_tier: '',
      terms_vi: 'Áp dụng cho toàn bộ danh mục bán lẻ với giá trị đơn từ 1.000.000đ.',
      terms_en: 'Valid across all retail items on orders from 1,000,000 VND.',
    },
  ];

  const insertExtraPromo = db.prepare(`
    INSERT OR IGNORE INTO promotions (
      code, title_vi, title_en, description_vi, description_en,
      promo_type, discount_type, discount_value, max_discount, min_order_value,
      eligible_category, start_date, end_date, usage_limit, used_count,
      per_customer_limit, combinable, member_only, min_tier, terms_vi, terms_en, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 3, 0, ?, ?, ?, ?, 1)
  `);
  for (const pr of extraPromos) {
    insertExtraPromo.run(
      pr.code,
      pr.title_vi,
      pr.title_en,
      pr.description_vi,
      pr.description_en,
      pr.promo_type,
      pr.discount_type,
      pr.discount_value,
      pr.max_discount,
      pr.min_order_value,
      pr.eligible_category,
      pr.start_date,
      pr.end_date,
      pr.usage_limit,
      pr.member_only,
      pr.min_tier,
      pr.terms_vi,
      pr.terms_en
    );
  }

  // 5. Seed demo orders & customer notifications for member@roarcoffee.vn if needed
  const memberUser = db.prepare("SELECT id, full_name, email, phone FROM users WHERE email = 'member@roarcoffee.vn'").get() as any;
  if (memberUser) {
    const orderCnt = (db.prepare('SELECT COUNT(*) as c FROM orders').get() as { c: number }).c;
    if (orderCnt <= 1) {
      const esp = db.prepare("SELECT id, sku, name_vi, name_en, price_vnd FROM products WHERE slug = 'roar-espresso'").get() as any;
      const esg = db.prepare("SELECT id, sku, name_vi, name_en, price_vnd FROM products WHERE slug = 'roar-espresso-gold'").get() as any;

      if (esp) {
        const pendingExists = db.prepare("SELECT id FROM orders WHERE order_number = 'RC-20261115-2048'").get();
        if (!pendingExists) {
          const r1 = db.prepare(`
            INSERT INTO orders (
              order_number, user_id, customer_name, customer_email, customer_phone, shipping_address,
              currency, subtotal, discount_amount, points_redeemed, points_discount, shipping_fee, total,
              voucher_code, payment_method, payment_status, order_status, tracking_code, notes
            ) VALUES (?, ?, ?, ?, ?, ?, 'VND', ?, 50000, 0, 0, 35000, ?, 'ROARESPRESSO50', 'vietqr', 'pending_verification', 'Pending', '', ?)
          `).run(
            'RC-20261115-2048',
            memberUser.id,
            memberUser.full_name,
            memberUser.email,
            memberUser.phone || '0909 123 456',
            '45 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
            390000,
            375000,
            'Giao giờ hành chính. [Customer QR/Wallet Ref: VQR-889124]'
          );
          db.prepare(`
            INSERT INTO order_items (order_id, product_id, sku, product_name_vi, product_name_en, variant_label, quantity, unit_price_vnd, line_total_vnd)
            VALUES (?, ?, ?, ?, ?, '250g · Whole Bean', 2, ?, ?)
          `).run(Number(r1.lastInsertRowid), esp.id, esp.sku, esp.name_vi, esp.name_en, esp.price_vnd, esp.price_vnd * 2);
        }
      }

      if (esg) {
        const shipExists = db.prepare("SELECT id FROM orders WHERE order_number = 'RC-20261114-1892'").get();
        if (!shipExists) {
          const r2 = db.prepare(`
            INSERT INTO orders (
              order_number, user_id, customer_name, customer_email, customer_phone, shipping_address,
              currency, subtotal, discount_amount, points_redeemed, points_discount, shipping_fee, total,
              voucher_code, payment_method, payment_status, order_status, tracking_code, notes
            ) VALUES (?, ?, ?, ?, ?, ?, 'VND', ?, 0, 0, 0, 0, ?, '', 'momo', 'paid', 'Shipping', 'GHN-ROAR-884210', 'Đã đóng gói chống sốc')
          `).run(
            'RC-20261114-1892',
            memberUser.id,
            memberUser.full_name,
            memberUser.email,
            memberUser.phone || '0909 123 456',
            '12 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
            440000,
            440000
          );
          db.prepare(`
            INSERT INTO order_items (order_id, product_id, sku, product_name_vi, product_name_en, variant_label, quantity, unit_price_vnd, line_total_vnd)
            VALUES (?, ?, ?, ?, ?, '500g · Whole Bean (Gold)', 1, 440000, 440000)
          `).run(Number(r2.lastInsertRowid), esg.id, esg.sku, esg.name_vi, esg.name_en);
        }
      }
    }

    const notifCnt = (db.prepare('SELECT COUNT(*) as c FROM user_notifications WHERE user_id = ?').get(memberUser.id) as { c: number }).c;
    if (notifCnt === 0) {
      const insertNotif = db.prepare(`
        INSERT INTO user_notifications (user_id, title_vi, title_en, message_vi, message_en, category, link_url, is_read)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertNotif.run(
        memberUser.id,
        'Đơn hàng RC-20261114-1892 đang được giao',
        'Order RC-20261114-1892 is out for delivery',
        'Đơn vị vận chuyển đã tiếp nhận kiện hàng mã vận đơn GHN-ROAR-884210. Vui lòng chú ý điện thoại khi nhận hàng.',
        'Carrier has picked up shipment GHN-ROAR-884210. Please keep your phone reachable.',
        'order',
        '/account',
        0
      );
      insertNotif.run(
        memberUser.id,
        'Ưu đãi thành viên mới: Giảm 15% toàn bộ dòng Rang Xay',
        'Member Perk: 15% Off All Roasted Coffee',
        'Sử dụng mã THANHVIEN15 khi thanh toán cho đơn hàng rang xay từ 250.000đ để nhận ưu đãi ngay.',
        'Apply code THANHVIEN15 at checkout on roasted coffee orders from 250,000 VND.',
        'promo',
        '/promotions',
        0
      );
      insertNotif.run(
        memberUser.id,
        'Đã cộng +49 điểm thưởng ROAR từ đơn RC-20261101-1001',
        '+49 ROAR Points Credited from Order RC-20261101-1001',
        'Điểm thưởng đã sẵn sàng quy đổi trực tiếp trong bước thanh toán đơn hàng tiếp theo.',
        'Your reward points are now available for redemption on your next checkout.',
        'loyalty',
        '/account',
        1
      );
    }
  }

  // 6. Ensure users RBAC columns exist & configure Super Admin + sample staff editor
  const userCols = db.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>;
  if (!userCols.some((c) => c.name === 'admin_role')) {
    db.exec("ALTER TABLE users ADD COLUMN admin_role TEXT NOT NULL DEFAULT 'none'");
  }
  if (!userCols.some((c) => c.name === 'admin_permissions_json')) {
    db.exec("ALTER TABLE users ADD COLUMN admin_permissions_json TEXT NOT NULL DEFAULT '[]'");
  }
  if (!userCols.some((c) => c.name === 'totp_secret')) {
    db.exec("ALTER TABLE users ADD COLUMN totp_secret TEXT NOT NULL DEFAULT ''");
  }
  if (!userCols.some((c) => c.name === 'totp_enabled')) {
    db.exec('ALTER TABLE users ADD COLUMN totp_enabled INTEGER NOT NULL DEFAULT 0');
  }
  if (!userCols.some((c) => c.name === 'totp_backup_codes_json')) {
    db.exec("ALTER TABLE users ADD COLUMN totp_backup_codes_json TEXT NOT NULL DEFAULT '[]'");
  }

  // 7. Ensure orders VAT company invoice columns exist on existing DBs
  const orderCols = db.prepare('PRAGMA table_info(orders)').all() as Array<{ name: string }>;
  if (!orderCols.some((c) => c.name === 'require_invoice')) {
    db.exec('ALTER TABLE orders ADD COLUMN require_invoice INTEGER NOT NULL DEFAULT 0');
  }
  if (!orderCols.some((c) => c.name === 'invoice_company_name')) {
    db.exec("ALTER TABLE orders ADD COLUMN invoice_company_name TEXT DEFAULT ''");
  }
  if (!orderCols.some((c) => c.name === 'invoice_tax_id')) {
    db.exec("ALTER TABLE orders ADD COLUMN invoice_tax_id TEXT DEFAULT ''");
  }
  if (!orderCols.some((c) => c.name === 'invoice_company_address')) {
    db.exec("ALTER TABLE orders ADD COLUMN invoice_company_address TEXT DEFAULT ''");
  }
  if (!orderCols.some((c) => c.name === 'invoice_email')) {
    db.exec("ALTER TABLE orders ADD COLUMN invoice_email TEXT DEFAULT ''");
  }

  db.prepare(`
    UPDATE users
    SET admin_role = 'super_admin', admin_permissions_json = ?
    WHERE email = 'admin@roarcoffee.vn' AND role = 'admin'
  `).run(JSON.stringify([...ALL_ADMIN_PERMISSIONS]));

  db.prepare(`
    UPDATE users
    SET admin_role = 'super_admin', admin_permissions_json = ?
    WHERE role = 'admin' AND (admin_role = 'none' OR admin_role = '')
  `).run(JSON.stringify([...ALL_ADMIN_PERMISSIONS]));

  const staffExists = db.prepare("SELECT id FROM users WHERE email = 'editor@roarcoffee.vn'").get();
  if (!staffExists) {
    db.prepare(`
      INSERT INTO users (
        email, password_hash, full_name, phone, role, admin_role, admin_permissions_json,
        member_code, tier, email_verified
      ) VALUES (?, ?, ?, ?, 'admin', 'content_editor', ?, ?, 'ROAR Gold', 1)
    `).run(
      'editor@roarcoffee.vn',
      hashPassword('RoarEditor!2026'),
      'Trần Thảo Vy (Biên tập CMS)',
      '0908 456 789',
      JSON.stringify(ADMIN_ROLE_PRESETS.content_editor),
      'RC-ADM-0002'
    );
  }

  const ownerRow = db.prepare("SELECT id, role FROM users WHERE LOWER(TRIM(email)) = 'taminhnghia.com@gmail.com'").get() as
    | { id: number; role: string }
    | undefined;
  if (!ownerRow) {
    db.prepare(`
      INSERT INTO users (
        email, password_hash, full_name, phone, role, admin_role, admin_permissions_json,
        member_code, tier, email_verified
      ) VALUES (?, '', ?, '', 'admin', 'super_admin', ?, ?, 'ROAR Reserve', 1)
    `).run(
      'taminhnghia.com@gmail.com',
      'Tạ Minh Nghĩa (Super Admin)',
      JSON.stringify([...ALL_ADMIN_PERMISSIONS]),
      'RC-ADM-0003'
    );
  } else {
    db.prepare(`
      UPDATE users
      SET role = 'admin', admin_role = 'super_admin', admin_permissions_json = ?, email_verified = 1
      WHERE id = ?
    `).run(JSON.stringify([...ALL_ADMIN_PERMISSIONS]), ownerRow.id);
  }

  // Normalize any legacy localized tier names to canonical ROAR tier names
  db.prepare("UPDATE users SET tier = 'ROAR Silver' WHERE LOWER(TRIM(tier)) IN ('roar bạc', 'roar bac', 'silver', 'hạng bạc')").run();
  db.prepare("UPDATE users SET tier = 'ROAR Gold' WHERE LOWER(TRIM(tier)) IN ('roar vàng', 'roar vang', 'gold', 'hạng vàng')").run();
  db.prepare("UPDATE users SET tier = 'ROAR Reserve' WHERE LOWER(TRIM(tier)) IN ('roar thượng hạng', 'roar thuong hang', 'reserve', 'platinum', 'bạch kim')").run();
  db.prepare("UPDATE users SET tier = 'ROAR Member' WHERE tier IS NULL OR TRIM(tier) = '' OR LOWER(TRIM(tier)) IN ('bronze', 'hạng đồng', 'member', 'thành viên')").run();

  // 7. Seed editable subpages (cms_pages) idempotently
  const seedPages: Array<{
    slug: string;
    route_path: string;
    group_name: string;
    eyebrow_vi: string;
    eyebrow_en: string;
    title_vi: string;
    title_en: string;
    subtitle_vi: string;
    subtitle_en: string;
    body_vi: string;
    body_en: string;
    hero_image_key: string;
    cta_label_vi: string;
    cta_label_en: string;
    cta_url: string;
    sections: Array<{
      tag_vi?: string;
      tag_en?: string;
      title_vi: string;
      title_en: string;
      body_vi: string;
      body_en: string;
    }>;
  }> = [
    {
      slug: 'about',
      route_path: '/about',
      group_name: 'story',
      eyebrow_vi: 'KHƠI BẢN LĨNH. ĐẬM CHẤT RIÊNG.',
      eyebrow_en: 'IGNITING COURAGE. DEFINING CHARACTER.',
      title_vi: 'Về Thương Hiệu ROAR COFFEE',
      title_en: 'About ROAR COFFEE',
      subtitle_vi: 'Thương hiệu cà phê Việt Nam kết nối di sản vùng trồng, kỷ luật nhân xanh và 7 cá tính đương đại.',
      subtitle_en: 'A Vietnamese coffee house uniting highland terroir, green bean discipline, and seven modern brand personalities.',
      body_vi: 'ROAR COFFEE là thương hiệu cà phê Việt Nam được xây dựng với tầm nhìn phát triển song hành thị trường nội địa và quốc tế. Chúng tôi kết nối di sản vùng trồng cà phê Việt Nam, kỷ luật tuyển chọn nhân xanh, tay nghề rang xay và 7 cá tính thương hiệu đương đại.',
      body_en: 'ROAR COFFEE is a Vietnamese coffee brand built for both domestic resonance and international growth — uniting authentic Vietnamese coffee heritage, disciplined green bean grading, modern roast craft, and seven distinctive brand personalities.',
      hero_image_key: 'hero_roar_coffee',
      cta_label_vi: 'Xem bộ sưu tập 7 Cá Tính',
      cta_label_en: 'Explore Seven Personalities',
      cta_url: '/personalities',
      sections: [
        {
          title_vi: 'Triết lý Nguồn gốc Minh bạch',
          title_en: 'Transparent Origin Philosophy',
          body_vi: 'Phân tách rõ ràng thông tin địa lý vùng cà phê Việt Nam với từng lô nguyên liệu được kiểm định chứng thư COA trước khi công bố.',
          body_en: 'We clearly distinguish general Vietnamese coffee geography from verified sourcing lots and laboratory COA documentation.',
        },
        {
          title_vi: 'Chuẩn mực Nhân xanh & Rang xay',
          title_en: 'Green & Roast Discipline',
          body_vi: 'Từ cấu hình 27 tổ hợp nhân xanh S14/S16/S18 (Natural, Honey, CBU) đến Robusta House Blend, Arabica Selection và Signature Reserve.',
          body_en: 'From our 27-variant S14/S16/S18 green bean matrix (Natural, Honey, CBU) to Robusta House Blend, Arabica Selection, and Signature Reserve.',
        },
        {
          title_vi: 'Khát vọng Vươn tầm Quốc tế',
          title_en: 'International Ambition',
          body_vi: 'Sẵn sàng đáp ứng tiêu chuẩn hợp tác B2B, HORECA, OEM / Private Label và xuất khẩu trên nền tảng thương mại số minh bạch.',
          body_en: 'Engineered to serve domestic HORECA, wholesale partners, private-label OEM clients, and international green coffee buyers.',
        },
      ],
    },
    {
      slug: 'origins',
      route_path: '/origins',
      group_name: 'story',
      eyebrow_vi: 'KHÁM PHÁ VÙNG NGUYÊN LIỆU CÀ PHÊ VIỆT NAM',
      eyebrow_en: 'DISCOVER THE ORIGINS OF VIETNAMESE COFFEE',
      title_vi: 'Bản Đồ Vùng Nguyên Liệu & Địa Lý Cà Phê Việt Nam',
      title_en: 'Vietnamese Coffee Origin Map',
      subtitle_vi: 'Bao phủ 10 vùng trồng cà phê tiêu biểu từ Tây Bắc đến Tây Nguyên và Đông Nam Bộ.',
      subtitle_en: 'Covering 10 authentic coffee regions from Northwest Vietnam to the Central Highlands and Southeast Vietnam.',
      body_vi: 'Bao phủ 10 vùng trồng cà phê tiêu biểu từ Tây Bắc (Sơn La, Điện Biên), Bắc Trung Bộ (Nghệ An Phủ Quỳ, Quảng Trị Khe Sanh), Tây Nguyên (Kon Tum, Gia Lai, Đắk Lắk, Đắk Nông, Lâm Đồng) đến Đông Nam Bộ (Đồng Nai) trên lớp ảnh vệ tinh và địa hình thực tế.',
      body_en: 'Covering 10 authentic coffee regions from Northwest Vietnam (Sơn La, Điện Biên), North Central Highlands & Khe Sanh (Nghệ An Phủ Quỳ, Quảng Trị), the Central Highlands (Kon Tum, Gia Lai, Đắk Lắk, Đắk Nông, Lâm Đồng) to Đồng Nai on real satellite and topographic imagery.',
      hero_image_key: 'origin_central_highlands',
      cta_label_vi: 'Xem Ma trận Nhân xanh',
      cta_label_en: 'View Green Coffee Matrix',
      cta_url: '/coffee/green-beans',
      sections: [],
    },
    {
      slug: 'farm-to-cup',
      route_path: '/farm-to-cup',
      group_name: 'story',
      eyebrow_vi: 'Từ Nông Trại Đến Tách Cà Phê',
      eyebrow_en: 'From Farm to Cup',
      title_vi: '8 Giai Đoạn Tạo Nên Chuẩn Mực ROAR COFFEE',
      title_en: 'Eight Stages of Coffee Craftsmanship',
      subtitle_vi: 'Hành trình minh bạch từ canh tác đến chiết xuất.',
      subtitle_en: 'A transparent craft pathway from farm cultivation to cup extraction.',
      body_vi: 'Hành trình minh bạch từ vùng trồng Tây Nguyên, qua 3 phương pháp sơ chế Natural, Honey, CBU đến tách cà phê hoàn chỉnh.',
      body_en: 'An educational journey from highland cultivation through Natural, Honey, and Washed (CBU) processing to final extraction.',
      hero_image_key: 'origin_central_highlands',
      cta_label_vi: 'Khám phá Cửa hàng Rang xay',
      cta_label_en: 'Explore Roasted Shop',
      cta_url: '/coffee/roasted',
      sections: [
        { title_vi: '01. Canh tác & Thổ nhưỡng', title_en: '01. Cultivation & Terroir', body_vi: 'Chăm sóc cây cà phê tại các vùng cao nguyên phù hợp về độ cao và đất đỏ bazan.', body_en: 'Stewardship across highland volcanic and limestone soils matched to Robusta and Arabica.' },
        { title_vi: '02. Thu hái chọn lọc', title_en: '02. Selective Harvesting', body_vi: 'Ưu tiên thu hái quả chín đỏ đồng đều để tối ưu lượng đường tự nhiên.', body_en: 'Targeting ripe red cherries to maximize natural sugar development and clean cup potential.' },
        { title_vi: '03. Sơ chế sau thu hoạch', title_en: '03. Post-Harvest Processing', body_vi: 'Thực hiện theo 3 phương pháp chuẩn hóa: Natural, Honey và Washed (CBU).', body_en: 'Processed via three disciplined methods: Natural, Honey, and Washed (CBU).' },
        { title_vi: '04. Tuyển chọn nhân xanh', title_en: '04. Green Bean Selection', body_vi: 'Phân sàng kích thước S14, S16, S18 và kiểm tra độ ẩm, tỷ trọng, khuyết tật.', body_en: 'Screen graded across S14, S16, S18 with controlled moisture, density, and defect verification.' },
        { title_vi: '05. Nghệ thuật Rang', title_en: '05. Precision Roasting', body_vi: 'Xây dựng biểu đồ nhiệt phù hợp cho từng dòng Robusta, Arabica hay Signature Reserve.', body_en: 'Tailored roast curves calibrated separately for Robusta, Arabica, Culi, and Reserve blends.' },
        { title_vi: '06. Xay theo phương pháp pha', title_en: '06. Precision Grinding', body_vi: 'Cỡ xay tương thích từ Phin thô-vừa đến Espresso mịn và Pour-over đồng nhất.', body_en: 'Particle distribution matched precisely to Phin, Espresso, Pour-over, French Press, or Cold Brew.' },
        { title_vi: '07. Chiết xuất & Pha chế', title_en: '07. Brewing & Extraction', body_vi: 'Kiểm soát nhiệt độ nước 90–94°C, tỷ lệ bột/nước và thời gian ủ nở.', body_en: 'Controlled water chemistry, 90–94°C thermal stability, bloom timing, and extraction yield.' },
        { title_vi: '08. Thưởng thức bản lĩnh', title_en: '08. Sensory Enjoyment', body_vi: 'Trải nghiệm trọn vẹn hương vị và dấu ấn cá tính riêng trong từng tách cà phê.', body_en: 'Experiencing authentic Vietnamese coffee character in daily rituals and curated tastings.' },
      ],
    },
    {
      slug: 'brewing',
      route_path: '/brewing',
      group_name: 'story',
      eyebrow_vi: 'Công thức tham chiếu Barista',
      eyebrow_en: 'Reference Brewing Recipes',
      title_vi: 'Hướng Dẫn Pha Chế ROAR COFFEE',
      title_en: 'ROAR COFFEE Brewing Guide',
      subtitle_vi: 'Phin Việt Nam · Espresso · Pour-over · French Press · Cold Brew',
      subtitle_en: 'Vietnamese Phin · Espresso · Pour-over · French Press · Cold Brew',
      body_vi: 'Các thông số dưới đây là công thức tham chiếu chuẩn mực, có thể tinh chỉnh theo khẩu vị và lô rang thực tế.',
      body_en: 'Reference recipes engineered as reliable starting points — adjustable for your roast lot and personal palate.',
      hero_image_key: 'product_robusta_house',
      cta_label_vi: 'Chọn cà phê theo gu pha',
      cta_label_en: 'Shop Coffee by Brew Method',
      cta_url: '/shop',
      sections: [],
    },
    {
      slug: 'signature-reserve',
      route_path: '/signature-reserve',
      group_name: 'story',
      eyebrow_vi: 'Phiên Bản Báo Đen · 60% Robusta · 20% Culi · 20% Arabica',
      eyebrow_en: 'Black Panther Edition · 60% Robusta · 20% Culi · 20% Arabica',
      title_vi: 'ROAR COFFEE SIGNATURE RESERVE',
      title_en: 'ROAR COFFEE SIGNATURE RESERVE',
      subtitle_vi: 'Tuyệt phẩm Báo Đen · Đen huyền & Vàng Champagne',
      subtitle_en: 'Black Panther Flagship · Obsidian Black & Champagne Gold',
      body_vi: 'Phiên bản đỉnh cao của ROAR COFFEE trong diện mạo đen huyền và vàng champagne. Kết hợp sức mạnh của 60% Robusta, độ đậm đặc của 20% Culi và nét thanh lịch của 20% Arabica với thành phần nhân xanh CBU chỉ định.',
      body_en: 'The pinnacle of ROAR COFFEE in obsidian black and champagne gold — harmonizing 60% Robusta, 20% Culi, and 20% Arabica with specified CBU green coffee ingredients.',
      hero_image_key: 'product_signature_reserve',
      cta_label_vi: 'Đặt mua Signature Reserve',
      cta_label_en: 'Acquire Signature Reserve',
      cta_url: '/product/signature-reserve',
      sections: [
        {
          title_vi: '01. Tuyển Ngôn Báo Đen',
          title_en: '01. The Black Panther Ethos',
          body_vi: 'Quý hiếm, bí ẩn, tinh tế và khác biệt. Signature Reserve ra đời cho những khoảnh khắc thưởng thức đòi hỏi chiều sâu và bản sắc riêng.',
          body_en: 'Exclusivity, mystery, sophistication, and distinction. Signature Reserve is conceived for moments that call for composed presence.',
        },
        {
          title_vi: '02. Cấu Trúc Phối Trộn Xác Thực',
          title_en: '02. Approved Blend Architecture',
          body_vi: '60% Robusta · 20% Culi · 20% Arabica kết hợp nguyên liệu nhân xanh CBU theo chỉ định kỹ thuật của ROAR COFFEE.',
          body_en: '60% Robusta · 20% Culi · 20% Arabica incorporating specified CBU washed green coffee ingredients.',
        },
        {
          title_vi: '03. Quà Tặng Doanh Nghiệp & Đóng Gói Cao Cấp',
          title_en: '03. Executive & Corporate Gifting',
          body_vi: 'Hộp thiếc đen nhám 250g, hộp quà cứng 500g và bộ quà tặng doanh nghiệp ánh vàng champagne tùy biến theo số lượng đặt hàng.',
          body_en: '250g matte obsidian canisters, 500g presentation boxes, and bespoke corporate gift sets finished in champagne gold.',
        },
      ],
    },
    {
      slug: 'farm-membership',
      route_path: '/farm-membership',
      group_name: 'story',
      eyebrow_vi: 'Định hướng tương lai · Đề xuất phát triển (Sắp ra mắt)',
      eyebrow_en: 'Future Concept · Proposed Community Program',
      title_vi: 'Trang Trại ROAR & Cộng Đồng Thành Viên',
      title_en: 'ROAR Coffee Farm & Membership Concept',
      subtitle_vi: 'Chương trình trải nghiệm giáo dục canh tác bền vững',
      subtitle_en: 'Experiential coffee cultivation & origin education community',
      body_vi: 'Không gian kết nối giáo dục canh tác cà phê bền vững, cập nhật mùa vụ, trải nghiệm tham quan nông trại đối tác và câu chuyện người trồng cà phê. Chương trình này là định hướng cộng đồng trải nghiệm — không phải mô hình sở hữu trang trại, cam kết lợi nhuận hay chia sẻ cổ phần.',
      body_en: 'A future-ready community concept dedicated to coffee cultivation education, seasonal harvest dispatches, curated farm visits, and grower storytelling. This initiative is strictly educational and experiential — it does not offer farm ownership, investment returns, or profit sharing.',
      hero_image_key: 'origin_central_highlands',
      cta_label_vi: 'Tìm hiểu hạng Thành viên',
      cta_label_en: 'Explore Membership Tiers',
      cta_url: '/account',
      sections: [
        {
          tag_vi: 'Sắp ra mắt / Đề xuất',
          tag_en: 'Proposed / Coming Soon',
          title_vi: 'Giáo dục Canh tác & Sơ chế',
          title_en: 'Cultivation & Processing Education',
          body_vi: 'Tìm hiểu vòng đời cây cà phê từ mùa hoa trắng Tây Nguyên đến thu hoạch và phơi Natural, Honey, CBU.',
          body_en: 'Follow the coffee lifecycle from Central Highlands blossom through selective harvest and Natural, Honey, and CBU drying.',
        },
        {
          tag_vi: 'Sắp ra mắt / Đề xuất',
          tag_en: 'Proposed / Coming Soon',
          title_vi: 'Nhật ký Mùa vụ (Đề xuất)',
          title_en: 'Seasonal Harvest Updates (Proposed)',
          body_vi: 'Cập nhật tiến độ thu hái theo từng vùng nguyên liệu hợp tác khi chương trình chính thức vận hành.',
          body_en: 'Scheduled harvest dispatches across verified partner localities once the program launches.',
        },
        {
          tag_vi: 'Sắp ra mắt / Đề xuất',
          tag_en: 'Proposed / Coming Soon',
          title_vi: 'Trải nghiệm Nông trại & Cupping',
          title_en: 'Farm Experiences & Cupping',
          body_vi: 'Lịch tham quan và thử nếm dành cho thành viên ROAR Gold & ROAR Reserve (Sắp ra mắt).',
          body_en: 'Curated origin visits and member cupping sessions planned for future ROAR Gold & Reserve cohorts.',
        },
      ],
    },
    {
      slug: 'partners',
      route_path: '/partners',
      group_name: 'b2b',
      eyebrow_vi: 'Cổng Thương Mại B2B & Phân Phối',
      eyebrow_en: 'B2B Wholesale & Distribution Portal',
      title_vi: 'Hợp Tác Kinh Doanh Cùng ROAR COFFEE',
      title_en: 'Partner with ROAR COFFEE',
      subtitle_vi: 'Hai hành trình thương mại chuyên biệt cho Rang xay HORECA và Nhân xanh B2B.',
      subtitle_en: 'Two dedicated commercial channels for Roasted Wholesale and Commercial Green Coffee.',
      body_vi: 'Thiết kế hai hành trình thương mại chuyên biệt cho đối tác Cà phê Rang xay (HORECA, Quán cà phê, Nhà phân phối, Siêu thị) và đối tác Cà phê Nhân xanh (Nhà rang, Nhà sản xuất, Đơn vị xuất nhập khẩu).',
      body_en: 'Two distinct commercial pathways tailored separately for Roasted Coffee buyers (HORECA, cafes, retailers, distributors) and Green Coffee buyers (roasters, manufacturers, importers, and traders).',
      hero_image_key: 'b2b_green_trade',
      cta_label_vi: 'Mở Ma trận Nhân xanh 27 SKUs',
      cta_label_en: 'Open Green Bean Matrix',
      cta_url: '/coffee/green-beans',
      sections: [
        {
          title_vi: 'Hành trình 01 · Bán sỉ Cà phê Rang xay & HORECA',
          title_en: 'Journey 01 · Roasted Coffee Wholesale & HORECA',
          body_vi: 'Dành cho chuỗi quán cà phê, nhà hàng, khách sạn, văn phòng và nhà bán lẻ tìm nguồn cung Robusta House Blend, Arabica Selection, Đậm, Phin, Espresso Gold và Signature Reserve.',
          body_en: 'Built for coffee shops, hotels, restaurants, supermarkets, and distributors seeking Robusta House Blend, Arabica Selection, Espresso Gold, or Signature Reserve.',
          tag_vi: 'Đăng ký tài khoản đối tác & xác minh doanh nghiệp\nBảng giá sỉ theo sản lượng định kỳ\nGửi mẫu thử rang xay & hỗ trợ công thức pha chế',
          tag_en: 'Partner registration & business verification\nVolume-based partner pricing tiers\nSample kits & barista recipe calibration',
        },
        {
          title_vi: 'Hành trình 02 · Thương mại Cà phê Nhân xanh B2B',
          title_en: 'Journey 02 · Commercial Green Coffee Trading',
          body_vi: 'Dành cho xưởng rang, nhà sản xuất cà phê hòa tan và đơn vị thương mại cần Robusta, Arabica, Culi cỡ sàng S14/S16/S18 (Natural, Honey, CBU) đóng bao 30kg, 60kg, 69kg hoặc Big Bag 1.000kg.',
          body_en: 'Engineered for commercial roasters, industrial buyers, and importers sourcing Robusta, Arabica, and Culi across S14/S16/S18 (Natural, Honey, CBU) in 30kg, 60kg, 69kg, or 1,000kg Big Bags.',
          tag_vi: '27 tổ hợp cấu hình chuẩn hóa theo mã SKU\nYêu cầu mẫu xanh đánh giá thử nếm trước hợp đồng\nĐơn hàng số lượng lớn, Container & Hợp đồng dài hạn',
          tag_en: '27-SKU standardized grading architecture\nPre-contract green sample evaluation\nBulk, container-load, and contract quotations',
        },
      ],
    },
    {
      slug: 'oem-export',
      route_path: '/oem-export',
      group_name: 'b2b',
      eyebrow_vi: 'Gia công OEM · Nhãn hiệu riêng · Xuất khẩu',
      eyebrow_en: 'OEM · Private Label · Export',
      title_vi: 'Dịch Vụ Gia Công OEM, Nhãn Hiệu Riêng & Xuất Khẩu',
      title_en: 'OEM, Private Label & International Export',
      subtitle_vi: 'Giải pháp phát triển nhãn hiệu cà phê trọn gói từ nhân xanh đến đóng gói xuất khẩu.',
      subtitle_en: 'End-to-end private label coffee manufacturing and export coordination.',
      body_vi: 'Hỗ trợ đối tác quốc tế và thương hiệu nội địa từ khâu tìm nguồn nhân xanh, phát triển hồ sơ rang, đóng gói theo yêu cầu đến phối hợp chứng từ xuất khẩu khi được xác thực.',
      body_en: 'Supporting international importers and private-label brands across green sourcing, roast profiling, custom packaging, MOQ planning, and verified export documentation support.',
      hero_image_key: 'b2b_green_trade',
      cta_label_vi: 'Xem Danh mục Bán sỉ',
      cta_label_en: 'View Wholesale Catalog',
      cta_url: '/partners',
      sections: [
        { title_vi: 'Tìm nguồn Nhân xanh', title_en: 'Green Coffee Sourcing', body_vi: 'Triển khai linh hoạt theo MOQ và thông số kỹ thuật đã thống nhất.', body_en: 'Configured per agreed MOQ and verified project specifications.' },
        { title_vi: 'Gia công Rang chuẩn hóa', title_en: 'Contract Roasting', body_vi: 'Xây dựng biểu đồ nhiệt riêng theo khẩu vị thị trường mục tiêu.', body_en: 'Custom roast profiling tailored to regional flavor preferences.' },
        { title_vi: 'Đóng gói Private Label', title_en: 'Private Label Packaging', body_vi: 'Túi van một chiều, hộp thiếc cao cấp hoặc bao lớn theo thiết kế đối tác.', body_en: 'One-way valve pouches, obsidian canisters, or bulk bags under your label.' },
        { title_vi: 'Hỗ trợ Chứng từ Xuất khẩu', title_en: 'Export Documentation Support', body_vi: 'Phối hợp CO, kiểm dịch thực vật và hồ sơ kỹ thuật theo Incoterms.', body_en: 'Documentation coordination aligned with verified shipment Incoterms.' },
      ],
    },
    {
      slug: 'contact',
      route_path: '/contact',
      group_name: 'b2b',
      eyebrow_vi: 'Liên hệ',
      eyebrow_en: 'Contact',
      title_vi: 'Kết Nối Với ROAR COFFEE',
      title_en: 'Connect with ROAR COFFEE',
      subtitle_vi: 'Hỗ trợ khách hàng bán lẻ, tư vấn HORECA, OEM và thương mại nhân xanh.',
      subtitle_en: 'Direct support for retail customers, HORECA, OEM, and green coffee inquiries.',
      body_vi: 'Đội ngũ ROAR COFFEE sẵn sàng phản hồi mọi yêu cầu về sản phẩm rang xay, mẫu thử nhân xanh B2B, quà tặng doanh nghiệp và hợp tác phân phối.',
      body_en: 'Our retail concierge and B2B export team respond promptly to product, sample kit, corporate gifting, and wholesale inquiries.',
      hero_image_key: 'hero_roar_coffee',
      cta_label_vi: 'Xem Yêu cầu Đối tác B2B',
      cta_label_en: 'Explore B2B Portal',
      cta_url: '/partners',
      sections: [],
    },
    {
      slug: 'privacy',
      route_path: '/privacy',
      group_name: 'legal',
      eyebrow_vi: 'Pháp lý & Tuân thủ',
      eyebrow_en: 'Legal & Compliance',
      title_vi: 'Chính sách Bảo mật',
      title_en: 'Privacy Policy',
      subtitle_vi: 'Quy định bảo vệ dữ liệu cá nhân và quyền riêng tư thành viên ROAR COFFEE.',
      subtitle_en: 'Member personal data protection and privacy governance.',
      body_vi: 'Tài liệu chính sách pháp lý và quy định thương mại chính thức của ROAR COFFEE được cập nhật và rà soát đầy đủ trước khi vận hành thương mại chính thức.\n\nTài khoản thành viên có quyền chỉnh sửa thông tin, quản lý tùy chọn thông báo và gửi yêu cầu xóa tài khoản trực tiếp tại trang Tài khoản cá nhân.',
      body_en: 'Official ROAR COFFEE legal policies and commercial terms are structured for compliance and finalized prior to commercial launch.\n\nRegistered members may update personal profiles, adjust communication preferences, and submit account deletion requests directly from their Account portal.',
      hero_image_key: '',
      cta_label_vi: 'Quản lý Tài khoản & Quyền riêng tư',
      cta_label_en: 'Manage Account Privacy',
      cta_url: '/account',
      sections: [],
    },
    {
      slug: 'terms',
      route_path: '/terms',
      group_name: 'legal',
      eyebrow_vi: 'Pháp lý & Tuân thủ',
      eyebrow_en: 'Legal & Compliance',
      title_vi: 'Điều khoản Sử dụng',
      title_en: 'Terms & Conditions',
      subtitle_vi: 'Điều khoản giao dịch thương mại và sử dụng website ROAR COFFEE.',
      subtitle_en: 'Commercial terms and platform usage conditions.',
      body_vi: 'Tài liệu chính sách pháp lý và quy định thương mại chính thức của ROAR COFFEE được cập nhật và rà soát đầy đủ trước khi vận hành thương mại chính thức.\n\nMọi thông tin thông số kỹ thuật, niên vụ và giá bán tham chiếu tuân thủ quy trình xác thực dữ liệu của ROAR COFFEE.',
      body_en: 'Official ROAR COFFEE legal policies and commercial terms are structured for compliance and finalized prior to commercial launch.\n\nAll product specifications, harvest details, and promotional terms remain governed by verified ROAR COFFEE commercial schedules.',
      hero_image_key: '',
      cta_label_vi: 'Liên hệ Pháp lý & CSKH',
      cta_label_en: 'Contact Support',
      cta_url: '/contact',
      sections: [],
    },
    {
      slug: 'shipping',
      route_path: '/shipping',
      group_name: 'legal',
      eyebrow_vi: 'Pháp lý & Tuân thủ',
      eyebrow_en: 'Legal & Compliance',
      title_vi: 'Chính sách Giao hàng & Đổi trả',
      title_en: 'Shipping & Returns',
      subtitle_vi: 'Quy định vận chuyển bán lẻ toàn quốc và điều kiện giao nhận B2B.',
      subtitle_en: 'Domestic retail shipping and commercial B2B delivery terms.',
      body_vi: 'Tài liệu chính sách pháp lý và quy định thương mại chính thức của ROAR COFFEE được cập nhật và rà soát đầy đủ trước khi vận hành thương mại chính thức.\n\nĐơn hàng bán lẻ được áp dụng vận chuyển tiêu chuẩn toàn quốc. Đơn hàng cà phê nhân xanh B2B áp dụng giao nhận theo điều kiện thương mại thống nhất (EXW / FOB / CIF).',
      body_en: 'Official ROAR COFFEE legal policies and commercial terms are structured for compliance and finalized prior to commercial launch.\n\nRetail orders ship via standard domestic couriers. B2B green coffee orders follow agreed commercial Incoterms and packaging specifications.',
      hero_image_key: '',
      cta_label_vi: 'Tra cứu Đơn hàng',
      cta_label_en: 'Track Order',
      cta_url: '/orders/track',
      sections: [],
    },
  ];

  const insertPage = db.prepare(`
    INSERT OR IGNORE INTO cms_pages (
      slug, route_path, group_name, eyebrow_vi, eyebrow_en, title_vi, title_en,
      subtitle_vi, subtitle_en, body_vi, body_en, hero_image_key,
      cta_label_vi, cta_label_en, cta_url, sections_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const p of seedPages) {
    insertPage.run(
      p.slug,
      p.route_path,
      p.group_name,
      p.eyebrow_vi,
      p.eyebrow_en,
      p.title_vi,
      p.title_en,
      p.subtitle_vi,
      p.subtitle_en,
      p.body_vi,
      p.body_en,
      p.hero_image_key,
      p.cta_label_vi,
      p.cta_label_en,
      p.cta_url,
      JSON.stringify(p.sections)
    );
  }

  // 7. Upgrade short starter personality stories to deep multi-paragraph narratives (preserve admin custom edits)
  const updatePersStory = db.prepare(`
    UPDATE personalities
    SET story_vi = ?, story_en = ?, traits_vi = ?, traits_en = ?
    WHERE slug = ? AND LENGTH(story_vi) < 300
  `);
  for (const p of DEEP_PERSONALITY_SEEDS) {
    updatePersStory.run(p.story_vi, p.story_en, p.traits_vi, p.traits_en, p.slug);
  }

  // 8. Seed 6 Roasted Coffee Beans (Cà phê Hạt rang) SKUs with 5-tier kg pricing idempotently
  const vcbSetting = db.prepare("SELECT value FROM site_settings WHERE key = 'vcb_usd_sell'").get() as { value: string } | undefined;
  const activeVcbRate = Number(vcbSetting?.value) || 25930;

  const insertRoastedBean = db.prepare(`
    INSERT OR IGNORE INTO products (
      slug, sku, barcode, category, sub_category, name_vi, name_en, subtitle_vi, subtitle_en,
      description_vi, description_en, coffee_type, blend_summary_vi, blend_summary_en, blend_public,
      roast_profile_vi, roast_profile_en, tasting_notes_vi, tasting_notes_en,
      brewing_methods_json, variants_json, pricing_tiers_json, packaging_options_json,
      price_vnd, price_usd, inventory, moq, status, is_demo_data,
      mascot_slug, screen_size, processing_method, origin_region,
      harvest_year, moisture_content, density, defect_info, grading_spec,
      image_key, gallery_images_json, featured
    ) VALUES (?, ?, ?, 'roasted_beans', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '1 kg', 'active', 1, '', ?, ?, ?, ?, 'N/A (Roasted Beans)', 'N/A (Roasted Beans)', '< 0.5% lỗi hạt chín sau rang', ?, 'product_roasting_drum_clean', '[]', ?)
  `);

  for (const rb of ROASTED_COFFEE_BEANS_SEEDS) {
    const tiers = buildFiveTierPrices(rb.tierPricesVnd, activeVcbRate);
    const tier1 = tiers[0];
    const variants = tiers.map((t) => ({
      label: t.labelVi,
      priceVnd: t.priceVnd,
      priceUsd: t.priceUsd,
    }));
    insertRoastedBean.run(
      rb.slug,
      rb.sku,
      rb.barcode,
      rb.gradeCode,
      rb.name_vi,
      rb.name_en,
      rb.subtitle_vi,
      rb.subtitle_en,
      rb.description_vi,
      rb.description_en,
      rb.coffee_type,
      rb.blend_summary_vi,
      rb.blend_summary_en,
      rb.roast_profile_vi,
      rb.roast_profile_en,
      rb.tasting_notes_vi,
      rb.tasting_notes_en,
      JSON.stringify(rb.brewing_methods),
      JSON.stringify(variants),
      JSON.stringify(tiers),
      JSON.stringify(['1 kg', '5 kg', '20 kg', '50 kg', '100 kg+']),
      tier1.priceVnd,
      tier1.priceUsd,
      rb.inventory,
      rb.screen_size,
      rb.processing_method,
      rb.origin_region,
      rb.harvest_year,
      rb.grading_spec,
      rb.featured
    );
  }

  // Ensure any existing roasted_beans rows without pricing_tiers_json get synced tiers
  const existingRb = db.prepare("SELECT id, slug, pricing_tiers_json FROM products WHERE category = 'roasted_beans'").all() as Array<{
    id: number;
    slug: string;
    pricing_tiers_json: string;
  }>;
  for (const row of existingRb) {
    if (!row.pricing_tiers_json || row.pricing_tiers_json === '[]') {
      const match = ROASTED_COFFEE_BEANS_SEEDS.find((rb) => rb.slug === row.slug);
      if (match) {
        const tiers = buildFiveTierPrices(match.tierPricesVnd, activeVcbRate);
        db.prepare('UPDATE products SET pricing_tiers_json = ? WHERE id = ?').run(JSON.stringify(tiers), row.id);
      }
    }
  }

  // 9. Backfill deterministic valid EAN-13 barcodes for all products missing a barcode
  const missingBarcodeRows = db.prepare("SELECT id, sku FROM products WHERE barcode IS NULL OR TRIM(barcode) = ''").all() as Array<{
    id: number;
    sku: string;
  }>;
  if (missingBarcodeRows.length > 0) {
    const updBarcode = db.prepare('UPDATE products SET barcode = ? WHERE id = ?');
    for (const row of missingBarcodeRows) {
      updBarcode.run(generateEan13Barcode(row.id * 17 + 100), row.id);
    }
  }

  // 10. Upgrade remaining Instant & Gift Voucher legacy image keys to bespoke ROAR AI photography
  const customImageUpgrades: Array<{ slug: string; target: string; legacyKeys: string[] }> = [
    { slug: 'instant-silver-collection', target: 'instant_silver_chill', legacyKeys: ['product_instant_silver_gold', '/assets/instant/instant-silver.jpg'] },
    { slug: 'instant-gold-collection', target: 'instant_gold_chill', legacyKeys: ['product_instant_silver_gold', '/assets/instant/instant-gold.jpg'] },
    { slug: 'gift-voucher-50k', target: '/assets/vouchers/gift-voucher-50k.jpg', legacyKeys: ['hero-roast', 'product_robusta_house'] },
    { slug: 'gift-voucher-100k', target: '/assets/vouchers/gift-voucher-100k.jpg', legacyKeys: ['signature-reserve', 'product_signature_reserve'] },
    { slug: 'gift-voucher-500k', target: '/assets/vouchers/gift-voucher-500k.jpg', legacyKeys: ['signature-reserve', 'product_signature_reserve'] },
    { slug: 'gift-voucher-1m', target: '/assets/vouchers/gift-voucher-1m.jpg', legacyKeys: ['signature-reserve', 'product_signature_reserve'] },
  ];
  for (const item of customImageUpgrades) {
    const row = db.prepare('SELECT id, image_key FROM products WHERE slug = ?').get(item.slug) as
      | { id: number; image_key: string }
      | undefined;
    if (row && (!row.image_key || item.legacyKeys.includes(row.image_key))) {
      db.prepare('UPDATE products SET image_key = ? WHERE id = ?').run(item.target, row.id);
    }
  }

  // 11. Upgrade Coffee Journal article image_key values to bespoke editorial AI illustrations
  const journalImageUpgrades: Array<{ slug: string; target: string; legacyKeys: string[] }> = [
    {
      slug: 'understanding-cbu-washed-process-in-vietnam',
      target: 'journal_cbu_washed',
      legacyKeys: ['product_green_coffee_beans'],
    },
    {
      slug: 'culi-peaberry-morphology-explained',
      target: 'journal_culi_peaberry',
      legacyKeys: ['product_robusta_house'],
    },
    {
      slug: 'vietnamese-phin-and-espresso-precision',
      target: 'journal_phin_espresso',
      legacyKeys: ['hero_roar_coffee'],
    },
    {
      slug: 'nghe-thuat-pha-phin-viet-nam-chuan-roar',
      target: 'journal_phin_ritual',
      legacyKeys: ['brewing-phin', 'product_brewing_ritual'],
    },
    {
      slug: 'hanh-trinh-arabica-cau-dat-1500m',
      target: 'journal_caudat_arabica',
      legacyKeys: ['origin-highlands', 'origin_central_highlands'],
    },
    {
      slug: 'phan-biet-natural-honey-va-cbu-washed',
      target: 'journal_coffee_processes',
      legacyKeys: ['green-beans', 'product_green_coffee_beans'],
    },
    {
      slug: 'bi-quyet-chon-hat-rang-s18-cho-quan-espresso',
      target: 'journal_s18_roastery',
      legacyKeys: ['hero-roast', 'product_roasting_drum_clean'],
    },
    {
      slug: '7-ca-tinh-roar-va-gu-thuong-thuc-cua-ban',
      target: 'journal_tasting_archetypes',
      legacyKeys: ['signature-reserve', 'product_signature_reserve'],
    },
    {
      slug: 'van-hoa-cold-brew-va-qua-tang-ca-phe-cao-cap',
      target: 'journal_coldbrew_gifting',
      legacyKeys: ['origin-highlands', 'origin_central_highlands'],
    },
  ];
  for (const item of journalImageUpgrades) {
    const row = db.prepare('SELECT id, image_key FROM journal_articles WHERE slug = ?').get(item.slug) as
      | { id: number; image_key: string }
      | undefined;
    if (row && (!row.image_key || item.legacyKeys.includes(row.image_key))) {
      db.prepare('UPDATE journal_articles SET image_key = ? WHERE id = ?').run(item.target, row.id);
    }
  }

  // 12. Normalize legacy Coffee Journal categories to the 5 canonical categories
  const categoryNormalizationMap: Record<string, string> = {
    Brewing: 'Brewing techniques',
    Origins: 'Coffee origins',
    Quality: 'Coffee processing',
    'B2B & HORECA': 'Coffee knowledge',
    Culture: 'Coffee knowledge',
    Lifestyle: 'Coffee knowledge',
  };
  const updateCatStmt = db.prepare('UPDATE journal_articles SET category = ? WHERE category = ?');
  for (const [legacyCat, canonicalCat] of Object.entries(categoryNormalizationMap)) {
    updateCatStmt.run(canonicalCat, legacyCat);
  }

  // 13. Seed Interactive Mini-Game configs, rewards (idempotent per game_key), and configurable check-in schedule
  const insertCfg = db.prepare(`
    INSERT OR IGNORE INTO game_configs (
      game_key, title_vi, title_en, subtitle_vi, subtitle_en,
      daily_free_plays, extra_play_cost_points, min_score_to_win, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const cfg of DEFAULT_GAME_CONFIGS) {
    insertCfg.run(
      cfg.game_key,
      cfg.title_vi,
      cfg.title_en,
      cfg.subtitle_vi,
      cfg.subtitle_en,
      cfg.daily_free_plays,
      cfg.extra_play_cost_points,
      cfg.min_score_to_win,
      cfg.active
    );
  }

  const countRewardsByKeyStmt = db.prepare('SELECT COUNT(*) as c FROM game_rewards WHERE game_key = ?');
  const insertReward = db.prepare(`
    INSERT INTO game_rewards (
      game_key, slot_order, label_vi, label_en, description_vi, description_en,
      reward_type, reward_value, min_order_value, max_discount,
      gift_product_id, gift_product_slug, gift_product_name_vi, gift_product_name_en, gift_product_variant, gift_image_key,
      weight, stock_total, stock_remaining, color_hex, badge_vi, badge_en, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const prodBySlug = db.prepare('SELECT id FROM products WHERE slug = ?');
  const seededKeys = new Set<string>();
  for (const rw of DEFAULT_GAME_REWARDS) {
    if (!seededKeys.has(rw.game_key)) {
      const existingCount = (countRewardsByKeyStmt.get(rw.game_key) as { c: number }).c;
      if (existingCount > 0) continue;
      seededKeys.add(rw.game_key);
    }
    let resolvedProdId = rw.gift_product_id;
    if (rw.gift_product_slug) {
      const matchedProd = prodBySlug.get(rw.gift_product_slug) as { id: number } | undefined;
      if (matchedProd) resolvedProdId = matchedProd.id;
    }
    insertReward.run(
      rw.game_key,
      rw.slot_order,
      rw.label_vi,
      rw.label_en,
      rw.description_vi,
      rw.description_en,
      rw.reward_type,
      rw.reward_value,
      rw.min_order_value,
      rw.max_discount,
      resolvedProdId,
      rw.gift_product_slug,
      rw.gift_product_name_vi,
      rw.gift_product_name_en,
      rw.gift_product_variant,
      rw.gift_image_key,
      rw.weight,
      rw.stock_total,
      rw.stock_remaining,
      rw.color_hex,
      rw.badge_vi,
      rw.badge_en,
      rw.active
    );
  }

  const checkinScheduleRow = db.prepare("SELECT key FROM site_settings WHERE key = 'checkin_schedule_json'").get();
  if (!checkinScheduleRow) {
    db.prepare('INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)').run(
      'checkin_schedule_json',
      JSON.stringify(DEFAULT_CHECKIN_SCHEDULE)
    );
  }

  // 14. Seed ROAR Candy Saga News, Official Starter Guilds & Transparent Auction Lots
  const newsCnt = (db.prepare('SELECT COUNT(*) as c FROM game_news_posts').get() as { c: number }).c;
  if (newsCnt === 0) {
    const insertNews = db.prepare(`
      INSERT INTO game_news_posts (title_vi, title_en, summary_vi, summary_en, body_vi, body_en, tag, pinned)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertNews.run(
      'Khai Mở Mùa Giải Candy Saga Season 1 · Đường Đua Cao Nguyên',
      'Candy Saga Season 1 Launch · Highland Sugar Sprint',
      'Cập nhật đổi kẹo 8 hướng & đổi chéo, sấm sét liên hoàn, đấu PvP thời gian thực và Bảng Xếp Hạng Mùa với phần thưởng Xu & điểm ROAR.',
      'Featuring 8-way diagonal swaps, lightning cascades, real-time WebSocket PvP duels, and Seasonal Honor Leaderboard prizes.',
      'Chào mừng các thành viên ROAR CLUB bước vào Mùa Giải 1 của ROAR Candy Saga! Người chơi có thể ghép kẹo theo 8 hướng (bao gồm cả đường chéo), kích hoạt Bom Cầu Vồng và Sấm Sét Liên Hoàn, gia nhập Bang Hội, đấu giá vật phẩm minh bạch và đua Top mùa giải.',
      'Welcome to Season 1 of ROAR Candy Saga! Swap candies in all 8 directions including diagonals, trigger Rainbow Bombs & Chain Lightning, join Guilds, bid on transparent auctions, and climb seasonal honor tiers.',
      'season',
      1
    );
    insertNews.run(
      'Sự Kiện Đấu Giá Minh Bạch & Nhiệm Vụ Tuần Chính Thức Mở Cửa',
      'Transparent Item Auction & Weekly Quests Now Live',
      'Hoàn thành nhiệm vụ tuần để nhận Xu & điểm ROAR, hoặc tham gia đấu giá gói Booster & Skin độc quyền theo thời gian thực.',
      'Complete weekly quests for Coins & ROAR points or bid transparently in real time on booster packs and exclusive skins.',
      'Mọi lượt đặt giá trên sàn Đấu Giá ROAR được ghi nhận theo thời gian thực và hoàn Xu tự động ngay lập tức khi có người trả giá cao hơn. Toàn bộ tiến trình game của bạn được tự động sao lưu định kỳ trên Cloud.',
      'All bids on the ROAR Auction House settle atomically with instant outbid coin refunds. Your game levels across all titles are automatically backed up to the cloud.',
      'event',
      0
    );
    insertNews.run(
      'Nâng Cấp Bảo Mật Tài Khoản Với Xác Thực Hai Lớp (2FA)',
      'Enhanced Account Security with Two-Factor Authentication (2FA)',
      'Kích hoạt 2FA TOTP (Google Authenticator / Authy) trong Tài khoản để bảo vệ ví điểm ROAR, Xu và vật phẩm đấu giá.',
      'Enable TOTP 2FA in Account Settings to protect your ROAR points wallet, coins, and auction assets.',
      'Hỗ trợ chuẩn RFC 6238 (6 chữ số mỗi 30 giây) kèm 8 mã khôi phục dự phòng một lần giúp bảo vệ tài khoản tuyệt đối trên mọi thiết bị.',
      'Built on RFC 6238 6-digit TOTP codes plus 8 single-use recovery backup codes for cross-device account protection.',
      'security',
      0
    );
  }

  const guildCnt = (db.prepare('SELECT COUNT(*) as c FROM guilds').get() as { c: number }).c;
  if (guildCnt === 0) {
    const adminRow = db.prepare("SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1").get() as { id: number } | undefined;
    const memberRow = db.prepare("SELECT id FROM users WHERE email = 'member@roarcoffee.vn'").get() as { id: number } | undefined;
    const g1 = db
      .prepare(
        `INSERT INTO guilds (name, tag, description, emblem_color, emblem_icon, leader_id, total_score, member_count)
         VALUES (?, ?, ?, ?, ?, ?, 4850, 1)`
      )
      .run('ROAR Highland Knights', 'ROAR', 'Bang hội chính thức dành cho tín đồ cà phê Tây Nguyên & cao thủ Candy Saga.', '#00552B', '🦁', adminRow?.id || null);
    if (adminRow) {
      db.prepare("INSERT OR IGNORE INTO guild_members (guild_id, user_id, role, contribution_score) VALUES (?, ?, 'leader', 4850)").run(
        Number(g1.lastInsertRowid),
        adminRow.id
      );
    }
    const g2 = db
      .prepare(
        `INSERT INTO guilds (name, tag, description, emblem_color, emblem_icon, leader_id, total_score, member_count)
         VALUES (?, ?, ?, ?, ?, ?, 3200, 1)`
      )
      .run('Cau Dat Thunder Guild', 'THDR', 'Đội đua Top Sấm Sét 8 Hướng & PvP Thời Gian Thực.', '#6D28D9', '⚡', memberRow?.id || null);
    if (memberRow) {
      db.prepare("INSERT OR IGNORE INTO guild_members (guild_id, user_id, role, contribution_score) VALUES (?, ?, 'leader', 3200)").run(
        Number(g2.lastInsertRowid),
        memberRow.id
      );
    }
  }

  const aucCnt = (db.prepare("SELECT COUNT(*) as c FROM auction_listings WHERE status = 'active'").get() as { c: number }).c;
  if (aucCnt === 0) {
    const endsSoon = new Date(Date.now() + 72 * 3600000).toISOString().slice(0, 19).replace('T', ' ');
    const insertAuc = db.prepare(`
      INSERT INTO auction_listings (seller_id, item_type, item_key, title_vi, title_en, starting_price, current_bid, bid_count, status, ends_at)
      VALUES (NULL, ?, ?, ?, ?, ?, ?, 0, 'active', ?)
    `);
    insertAuc.run(
      'booster_pack',
      'mega_thunder_pack',
      'Gói Siêu Hỗ Trợ (3 Búa Kẹo + 2 Bom Cầu Vồng + 3 Đổi 8 Hướng)',
      'Mega Booster Bundle (3 Hammers + 2 Color Bombs + 3 8-Way Switchers)',
      60,
      60,
      endsSoon
    );
    insertAuc.run(
      'skin_voucher',
      'thunder_panther',
      'Trang Phục Độc Quyền: Báo Đen Sấm Sét (Lôi Kích +25%)',
      'Exclusive Skin: Thunder Black Panther (+25% Lightning)',
      120,
      120,
      endsSoon
    );
    insertAuc.run(
      'booster_pack',
      'moves5_pack',
      'Bộ 5 Vé +5 Lượt Đi Kẹo Ngọt Cao Cấp',
      '5x Extra +5 Moves Saga Pack',
      45,
      45,
      endsSoon
    );
  }

  // Seed Cube Away 3D profiles for existing member/staff records if none exist yet
  const cubeProfilesCount = (db.prepare('SELECT COUNT(*) as c FROM cubeaway_profiles').get() as { c: number }).c;
  if (cubeProfilesCount === 0) {
    const existingUsers = db.prepare('SELECT id FROM users ORDER BY id ASC LIMIT 6').all() as Array<{ id: number }>;
    const starterPresets = [
      { badge: 'black-panther', lvl: 6, maxLvl: 9, score: 3420, xp: 180, coins: 260, skin: 'roar_gold' },
      { badge: 'eagle', lvl: 5, maxLvl: 7, score: 2650, xp: 120, coins: 190, skin: 'arcade' },
      { badge: 'tiger', lvl: 4, maxLvl: 6, score: 1980, xp: 90, coins: 150, skin: 'cyber_neon' },
    ];
    existingUsers.forEach((u, idx) => {
      const p = starterPresets[idx % starterPresets.length];
      db.prepare(`
        INSERT OR IGNORE INTO cubeaway_profiles (
          user_id, avatar_badge, xp, level, coins, current_level, max_level, total_score, levels_cleared, active_skin, unlocked_skins_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        u.id,
        p.badge,
        p.xp,
        p.lvl,
        p.coins,
        p.maxLvl,
        p.maxLvl,
        p.score,
        Math.max(1, p.maxLvl - 1),
        p.skin,
        JSON.stringify(p.skin === 'arcade' ? ['arcade'] : ['arcade', p.skin])
      );
    });
  }

  // 14. Seed 16 new retail Coffee & Highland Pepper lines idempotently
  const insertRetailProduct = db.prepare(`
    INSERT OR IGNORE INTO products (
      slug, sku, barcode, category, sub_category, name_vi, name_en, subtitle_vi, subtitle_en,
      description_vi, description_en, coffee_type, blend_summary_vi, blend_summary_en, blend_public,
      roast_profile_vi, roast_profile_en, tasting_notes_vi, tasting_notes_en,
      brewing_methods_json, variants_json, pricing_tiers_json, packaging_options_json,
      price_vnd, price_usd, inventory, moq, status, is_demo_data,
      mascot_slug, screen_size, processing_method, origin_region,
      harvest_year, moisture_content, density, defect_info, grading_spec,
      image_key, gallery_images_json, featured
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, '[]', ?, ?, ?, ?, ?, 'active', 0, ?, ?, ?, ?, ?, ?, 'N/A', 'Kiểm soát sạch tạp chất', ?, ?, '[]', ?)
  `);

  for (const item of RETAIL_NEW_LINES_SEEDS) {
    const priceUsd = Math.round((item.price_vnd / activeVcbRate) * 100) / 100;
    const variants = [{ label: item.variant_label, priceVnd: item.price_vnd, priceUsd }];
    insertRetailProduct.run(
      item.slug,
      item.sku,
      item.barcode,
      item.category,
      item.sub_category,
      item.name_vi,
      item.name_en,
      item.subtitle_vi,
      item.subtitle_en,
      item.description_vi,
      item.description_en,
      item.coffee_type,
      item.blend_summary_vi,
      item.blend_summary_en,
      item.roast_profile_vi,
      item.roast_profile_en,
      item.tasting_notes_vi,
      item.tasting_notes_en,
      JSON.stringify(item.brewing_methods),
      JSON.stringify(variants),
      JSON.stringify([item.unit_pack_label]),
      item.price_vnd,
      priceUsd,
      item.inventory,
      item.moq,
      item.mascot_slug,
      item.screen_size,
      item.processing_method,
      item.origin_region,
      item.harvest_year,
      item.moisture_content,
      item.grading_spec,
      item.image_key,
      item.featured
    );
  }

  // 15. Upgrade pepper & instant coffee image_keys to photorealistic & chill studio photography
  const retailPhotoUpgrades: Array<[string, string, string[]]> = [
    ['ca-phe-hoa-tan-3in1-hop-10-goi', 'instant_3in1_box_chill', ['/assets/instant/instant-silver.jpg', 'product_instant_silver_gold']],
    ['ca-phe-hoa-tan-3in1-tui-45-goi', 'instant_3in1_pouch_45_chill', ['/assets/instant/instant-gold.jpg', 'product_instant_silver_gold']],
    ['ca-phe-muoi-hop-10-goi', 'instant_salted_coffee_chill', ['product_instant_silver_gold', '/assets/instant/instant-gold.jpg']],
    ['tieu-den-xay-45g', 'pepper_ground_black_jar', ['/assets/pepper/tieu-den-xay.svg']],
    ['tieu-den-xay-90g', 'pepper_ground_black_jar', ['/assets/pepper/tieu-den-xay.svg']],
    ['tieu-den-so-45g', 'pepper_hulled_white_jar', ['/assets/pepper/tieu-den-so.svg']],
    ['tieu-den-so-90g', 'pepper_hulled_white_jar', ['/assets/pepper/tieu-den-so.svg']],
    ['tieu-den-hat-coi-xay-70g', 'pepper_black_grinder_jar', ['/assets/pepper/tieu-den-coi-xay.svg']],
    ['tieu-so-hat-coi-xay-70g', 'pepper_white_grinder_jar', ['/assets/pepper/tieu-so-coi-xay.svg']],
  ];
  for (const [slug, nextKey, legacyList] of retailPhotoUpgrades) {
    const row = db.prepare('SELECT id, image_key FROM products WHERE slug = ?').get(slug) as { id: number; image_key: string } | undefined;
    if (row && (!row.image_key || legacyList.includes(row.image_key))) {
      db.prepare('UPDATE products SET image_key = ? WHERE id = ?').run(nextKey, row.id);
    }
  }
}

const DEEP_PERSONALITY_SEEDS = [
  {
    slug: 'tiger',
    animal_en: 'Tiger',
    animal_vi: 'Hổ',
    traits_vi: 'Mạnh mẽ · Quyết đoán · Bản lĩnh · Tiên phong',
    traits_en: 'Boldness · Strength · Determination · Vanguard',
    story_vi:
      'Trong khu rừng nguyên sinh của hương vị cà phê Việt, Hổ không ồn ào phô trương mà bước đi bằng nội lực trầm ổn và sự tập trung tuyệt đối. Khi bình minh chưa kịp ló rạng trên cao nguyên bazan đỏ, người mang khí chất Hổ đã sẵn sàng khởi đầu ngày mới với mục tiêu rõ ràng và ý chí không thỏa hiệp.\n\nTinh thần ấy được chuyển hóa trọn vẹn vào dòng ROAR COFFEE ĐẬM: nền Robusta chọn lọc từ Đắk Lắk rang ở mức đậm chuẩn xác (Full City+), giải phóng nốt sô-cô-la đen đặc quánh, đường nâu cháy nhẹ và lớp crema dày dặn kéo dài nơi hậu vị. Từng ngụm cà phê như cú bật dứt khoát đánh thức sự tỉnh táo tức thì.\n\nDù bạn thưởng thức một ly cà phê đen đá cô đặc trước cuộc họp chiến lược hay nạp năng lượng cho buổi tập cường độ cao, biểu tượng Hổ luôn là lời nhắc nhở về kỷ luật bản thân và bản lĩnh đứng vững trước mọi áp lực.',
    story_en:
      'Deep within the highland frontier of Vietnamese coffee, the Tiger moves with quiet intensity and unwavering focus. Long before dawn breaks over the red basalt plateaus, those who carry the Tiger temperament are already aligned with their mission—decisive, disciplined, and unafraid of demanding terrain.\n\nThat ethos lives inside ROAR COFFEE ĐẬM: carefully screened highland Robusta roasted to a deliberate Full City+ profile, unlocking dark cacao, toasted brown sugar, and a dense, lingering body. Every sip strikes with clean authority rather than harsh bitterness.\n\nWhether poured over ice before a high-stakes morning briefing or brewed strong to anchor a marathon creative sprint, the Tiger crest stands as an emblem of inner strength and relentless forward momentum.',
    product_association_vi: 'ROAR COFFEE ĐẬM',
    product_association_en: 'ROAR COFFEE ĐẬM',
    associated_product_slug: 'roar-dam-bold',
    is_future_collection: 0,
    image_key: 'mascot_tiger',
    sort_order: 1,
  },
  {
    slug: 'lion',
    animal_en: 'Lion',
    animal_vi: 'Sư Tử',
    traits_vi: 'Lãnh đạo · Tự tin · Uy nghi · Chuẩn mực',
    traits_en: 'Leadership · Confidence · Authority · Heritage',
    story_vi:
      'Sư Tử không chạy theo nhịp vội vã của đám đông; quyền uy của người dẫn đầu nằm ở sự điềm tĩnh, tầm vóc vững chãi và khả năng giữ nhịp cho cả tập thể. Hình tượng Sư Tử tôn vinh nghi thức cà phê Phin truyền thống Việt Nam — nơi thời gian nhỏ giọt chậm rãi chính là thước đo của chiều sâu tư duy.\n\nGắn liền với ROAR COFFEE PHIN, công thức phối trộn cân bằng giữa độ đầm vị của Robusta truyền thống và hậu ngọt dịu từ hạt Culi chín mọng mang đến ly cà phê có cấu trúc tròn đầy, hương ca cao rang cùng gỗ tuyết tùng ấm áp.\n\nMỗi giọt cà phê rơi qua nắp gài nhôm Phin là khoảnh khắc người lãnh đạo quan sát bức tranh toàn cảnh trước khi đưa ra quyết định trọng đại — chậm rãi trong chuẩn bị, uy lực trong hành động.',
    story_en:
      'The Lion never rushes with the crowd; true authority resides in composure, steady presence, and the clarity to anchor an entire room. The Lion archetype honors Vietnam’s iconic Phin filter ritual—where every unhurried drop becomes an exercise in patience and strategic foresight.\n\nPaired with ROAR COFFEE PHIN, its balanced blend unites highland Robusta richness with rounded Culi sweetness, yielding warm cocoa aromatics, velvety mouthfeel, and cedarwood depth tailored for both black Phin and Cà Phê Sữa Đá.\n\nWatching each slow drip gather beneath the stainless press invites leaders and builders to pause, calibrate their vision, and act with unmistakable poise.',
    product_association_vi: 'ROAR COFFEE PHIN',
    product_association_en: 'ROAR COFFEE PHIN',
    associated_product_slug: 'roar-phin-heritage',
    is_future_collection: 0,
    image_key: 'mascot_lion',
    sort_order: 2,
  },
  {
    slug: 'fox',
    animal_en: 'Fox',
    animal_vi: 'Cáo',
    traits_vi: 'Thông minh · Linh hoạt · Sáng tạo · Nhạy bén',
    traits_en: 'Intelligence · Agility · Creativity · Precision',
    story_vi:
      'Giữa thế giới thay đổi từng giờ, lợi thế thuộc về những tâm trí biết quan sát tinh tế và xoay chuyển linh hoạt. Cáo đại diện cho thế hệ sáng tạo, nhà thiết kế, lập trình viên và các Barista hiện đại — những người biến giới hạn kỹ thuật thành sân chơi của ý tưởng mới.\n\nHồ sơ rang của ROAR COFFEE ESPRESSO được thiết kế chuẩn xác cho biểu tượng Cáo: độ rang Medium-Dark giữ lại độ chua thanh thoát của Arabica cao nguyên hòa quyện cùng thân vị dày mượt của Robusta tuyển chọn, lý tưởng cho cả Espresso nguyên bản lẫn Flat White, Latte hay Cold Brew.\n\nMột shot Espresso 18g chiết xuất đúng 28 giây mở ra mùi hạnh nhân rang, caramel bơ và sô-cô-la sữa — tiếp lửa cho những buổi brainstorm sắc sảo và nhịp sống đô thị không ngừng chuyển động.',
    story_en:
      'In a world shifting by the hour, edge belongs to agile minds capable of reading subtle patterns and reinventing the playbook. The Fox celebrates modern creators, designers, engineers, and contemporary baristas who turn precision into creative freedom.\n\nCrafted around ROAR COFFEE ESPRESSO, this Medium-Dark profile harmonizes bright highland Arabica nuance with silky Robusta structure—performing seamlessly across straight double shots, velvety Flat Whites, and crisp iced tonics.\n\nDialed at 18g in to 36g out, it releases toasted almond, salted butter caramel, and milk chocolate notes designed to spark sharp intuition throughout fast-moving city days.',
    product_association_vi: 'ROAR COFFEE ESPRESSO',
    product_association_en: 'ROAR COFFEE ESPRESSO',
    associated_product_slug: 'roar-espresso',
    is_future_collection: 0,
    image_key: 'mascot_fox',
    sort_order: 3,
  },
  {
    slug: 'eagle',
    animal_en: 'Eagle',
    animal_vi: 'Đại Bàng',
    traits_vi: 'Tầm nhìn · Tham vọng · Bứt phá · Đỉnh cao',
    traits_en: 'Vision · Ambition · Excellence · Mastery',
    story_vi:
      'Từ độ cao nghìn mét nhìn xuống toàn bộ dải đại ngàn, Đại Bàng không tìm kiếm con đường dễ dàng mà hướng tới những đỉnh cao đòi hỏi tiêu chuẩn khắt khe nhất. Đó cũng là triết lý đứng sau các lô hạt sàng S18 chế biến ướt (CBU) và Honey được chọn lọc nghiêm ngặt cho ROAR COFFEE ESPRESSO GOLD.\n\nVới kích thước hạt đồng đều trên sàng 18, từng mẻ rang được kiểm soát bằng đường nhiệt tinh chỉnh nhằm bảo toàn hương hoa cà phê, vị ngọt mật ong rừng và cấu trúc crema óng ánh như sắc vàng ròng dưới áp suất 9 bar.\n\nBiểu tượng Đại Bàng dành riêng cho các quầy bar tiêu chuẩn quốc tế, chuỗi HORECA cao cấp và những người thưởng thức luôn đặt chất lượng hoàn mỹ làm thước đo danh dự.',
    story_en:
      'Soaring above the mountain canopy, the Eagle commands panoramic perspective—drawn not to shortcuts, but to standards that demand disciplined mastery. That spirit guides the Grade S18 Washed (CBU) and Honey-processed highland lots selected for ROAR COFFEE ESPRESSO GOLD.\n\nWith uniform S18 bean geometry calibrated through precision roast curves, each batch preserves delicate floral lift, wildflower honey sweetness, and gleaming tiger-striped crema at 9 bars of pressure.\n\nThe Eagle crest is built for flagship hospitality bars, ambitious specialty venues, and discerning palates who treat excellence as non-negotiable.',
    product_association_vi: 'ROAR COFFEE ESPRESSO GOLD',
    product_association_en: 'ROAR COFFEE ESPRESSO GOLD',
    associated_product_slug: 'roar-espresso-gold',
    is_future_collection: 0,
    image_key: 'mascot_eagle',
    sort_order: 4,
  },
  {
    slug: 'wolf',
    animal_en: 'Wolf',
    animal_vi: 'Sói',
    traits_vi: 'Độc lập · Kiên định · Bền bỉ · Trung thành',
    traits_en: 'Independence · Resilience · Endurance · Loyalty',
    story_vi:
      'Sói đại diện cho sức bền âm thầm nhưng không thể khuất phục trên những hành trình dài hơi. Trong bầy đàn, Sói tôn trọng kỷ luật và sự gắn kết; khi bước đi một mình giữa sương núi, Sói tin tưởng tuyệt đối vào bản năng được tôi luyện qua năm tháng.\n\nTrong vũ trụ cá tính ROAR COFFEE®, hình tượng Sói được dành riêng cho bộ sưu tập thử nghiệm tương lai — nơi các dòng hạt đơn nguồn (Single Origin) thu hái muộn ở độ cao 1.500m+ đang được ủ men và rang thử nghiệm để đạt cấu trúc vị trầm ấm, hậu vị dài bền bỉ.\n\nKhi bộ sưu tập Sói chính thức ra mắt, đó sẽ là người bạn đồng hành dành cho những nhà thám hiểm, người chạy đường dài và những tâm hồn bền gan giữ vững lý tưởng của mình.',
    story_en:
      'The Wolf embodies quiet, unbreakable endurance across demanding horizons. Within its pack, the Wolf honors loyalty and shared discipline; alone under misty mountain skies, it relies on instincts forged through patience and grit.\n\nWithin the ROAR COFFEE® personality universe, the Wolf is reserved for an upcoming experimental collection—spotlighting high-altitude (1,500m+) late-harvest single-origin lots currently undergoing small-batch fermentation and roast R&D.\n\nDesigned for long-haul builders, backcountry travelers, and independent thinkers, the Wolf edition will celebrate steadfast character from first bloom to final sip.',
    product_association_vi: 'Bộ sưu tập tương lai (Sắp ra mắt)',
    product_association_en: 'Future Collection (Coming Soon)',
    associated_product_slug: '',
    is_future_collection: 1,
    image_key: 'mascot_wolf',
    sort_order: 5,
  },
  {
    slug: 'owl',
    animal_en: 'Owl',
    animal_vi: 'Cú Mèo',
    traits_vi: 'Trí tuệ · Sâu sắc · Tinh tế · Chiêm nghiệm',
    traits_en: 'Wisdom · Insight · Refinement · Contemplation',
    story_vi:
      'Khi màn đêm buông xuống và thế giới lắng lại, Cú Mèo mở rộng tầm nhìn để lắng nghe những chuyển động tinh vi mà ban ngày thường bỏ lỡ. Đó là biểu tượng của sự chiêm nghiệm sâu sắc, tri thức tĩnh tại và gu thưởng thức đặt trọng tâm vào tầng hương phức hợp thay vì cường độ mạnh bạo.\n\nDành cho bộ sưu tập tương lai hướng tới phương pháp Pour-over (V60, Kalita) và Cold Brew ủ lạnh 18 giờ, cá tính Cú Mèo tôn vinh mức rang sáng-vừa (Light-Medium) giúp từng lớp hương trà xanh, cam chanh chín và thảo mộc núi rừng hiện lên trong trẻo.\n\nBiểu tượng này dành tặng những giờ đọc sách yên ả, các phiên làm việc đêm khuya đầy minh mẫn và những cuộc trò chuyện tri âm bên tách cà phê thơm nhẹ.',
    story_en:
      'When evening settles and noise fades away, the Owl perceives subtle harmonies others overlook in daylight. It represents contemplative intelligence, unhurried wisdom, and a palate tuned toward aromatic clarity over sheer roast intensity.\n\nEnvisioned for an upcoming filter and 18-hour Cold Brew release, the Owl collection focuses on Light-Medium roast curves that elevate jasmine tea florals, candied citrus peel, and clean mountain-herb finish in V60 and Chemex pours.\n\nCrafted for quiet studio nights, reflective reading hours, and thoughtful dialogue shared over crystalline cups.',
    product_association_vi: 'Bộ sưu tập tương lai (Sắp ra mắt)',
    product_association_en: 'Future Collection (Coming Soon)',
    associated_product_slug: '',
    is_future_collection: 1,
    image_key: 'mascot_owl',
    sort_order: 6,
  },
  {
    slug: 'black-panther',
    animal_en: 'Black Panther',
    animal_vi: 'Báo Đen',
    traits_vi: 'Quý hiếm · Bí ẩn · Tinh tế · Độc bản',
    traits_en: 'Exclusivity · Mystery · Sophistication · Distinction',
    story_vi:
      'Báo Đen là đỉnh cao quyền lực lặng lẽ trong bộ sưu tập ROAR COFFEE® — thanh lịch trong sắc đen huyền bí kết hợp ánh vàng champagne sang trọng. Không cần phô trương lời giới thiệu, sự hiện diện của Báo Đen tự thân đã định nghĩa đẳng cấp độc bản.\n\nTinh hoa ấy hội tụ trong ROAR COFFEE SIGNATURE RESERVE với tỷ lệ vàng 60% Robusta đậm đà, 20% Culi tròn vị và 20% Arabica thơm sâu: tạo nên hợp âm đa tầng từ nốt ca cao nguyên chất, vani ấm, trái cây sấy đến lớp hậu vị nhung lụa kéo dài hiếm thấy.\n\nĐược đóng hộp thiếc đen mờ dập nổi chuẩn quà tặng cao cấp, Signature Reserve là tuyên ngôn phong cách cho những dịp ký kết quan trọng, phòng khách hạng sang và những người chỉ chọn điều tinh túy nhất.',
    story_en:
      'The Black Panther crowns the ROAR COFFEE® archetype pantheon—sleek in obsidian black and champagne gold, radiating rare poise without ever raising its voice. Its mere presence sets a benchmark of quiet distinction.\n\nThat artistry culminates in ROAR COFFEE SIGNATURE RESERVE, uniting an architectural triad of 60% bold Robusta, 20% velvety Culi Peaberry, and 20% aromatic Arabica. Together they compose layered notes of pure cacao nib, warm vanilla bean, dried fig, and a supple cashmere finish.\n\nPresented in matte obsidian canisters crafted for executive gifting and private tasting rooms, Signature Reserve belongs to milestone moments and collectors of the extraordinary.',
    product_association_vi: 'ROAR COFFEE SIGNATURE RESERVE',
    product_association_en: 'ROAR COFFEE SIGNATURE RESERVE',
    associated_product_slug: 'signature-reserve',
    is_future_collection: 0,
    image_key: 'mascot_panther',
    sort_order: 7,
  },
];

const ROASTED_COFFEE_BEANS_SEEDS: Array<{
  slug: string;
  sku: string;
  gradeCode: string;
  barcode: string;
  name_vi: string;
  name_en: string;
  subtitle_vi: string;
  subtitle_en: string;
  description_vi: string;
  description_en: string;
  coffee_type: string;
  blend_summary_vi: string;
  blend_summary_en: string;
  roast_profile_vi: string;
  roast_profile_en: string;
  tasting_notes_vi: string;
  tasting_notes_en: string;
  brewing_methods: string[];
  tierPricesVnd: [number, number, number, number, number];
  inventory: number;
  screen_size: string;
  processing_method: string;
  origin_region: string;
  harvest_year: string;
  grading_spec: string;
  featured: number;
}> = [
  {
    slug: 'roasted-beans-robusta-s18',
    sku: 'RC-RBN-ROS18',
    gradeCode: 'RO-S18',
    barcode: generateEan13Barcode(9101),
    name_vi: 'CÀ PHÊ HẠT RANG ROBUSTA S18',
    name_en: 'ROASTED COFFEE BEANS ROBUSTA S18',
    subtitle_vi: 'Mã phẩm cấp RO-S18 · Hạt rang nguyên chất sàng 18 tiêu chuẩn quán & rang xay sỉ',
    subtitle_en: 'Grade RO-S18 · Screen 18 Whole Roasted Beans for Cafés & Wholesale',
    description_vi:
      'Hạt cà phê Robusta tuyển chọn kích thước sàng 18 (7.1mm) thu hoạch chín từ cao nguyên bazan Đắk Lắk – Gia Lai, rang công nghiệp kiểm soát hồi nhiệt giúp hạt chín đều từ tâm ra vỏ. Mang đến body dày đầm, lớp crema nâu hổ phách bền vững, vị đắng thanh sạch không khét, tối ưu cho pha máy Espresso phối trộn, pha Phin truyền thống và hệ thống chuỗi quán cà phê.',
    description_en:
      'Selected Screen 18 (7.1mm) highland Robusta harvested ripe across Đắk Lắk and Gia Lai, precision drum-roasted for uniform core development. Delivers heavy body, dense amber crema, clean dark-cacao bitterness, and reliable daily extraction for espresso blends, Vietnamese Phin, and high-volume café chains.',
    coffee_type: '100% Robusta S18 (Hạt rang nguyên chất)',
    blend_summary_vi: '100% Robusta sàng 18 · Thuần hạt rang nguyên chất không tẩm ướp',
    blend_summary_en: '100% Screen 18 Robusta · Pure unflavored whole roasted beans',
    roast_profile_vi: 'Rang Vừa-Đậm (Medium-Dark · Agtron ~48)',
    roast_profile_en: 'Medium-Dark Roast (Agtron ~48)',
    tasting_notes_vi: 'Sô-cô-la đen · Hạt dẻ rang · Đường thắng · Crema dày bền',
    tasting_notes_en: 'Dark chocolate · Roasted hazelnut · Caramelized sugar · Heavy crema',
    brewing_methods: ['Espresso', 'Vietnamese Phin', 'Moka Pot', 'Commercial Roasting'],
    tierPricesVnd: [240000, 225000, 210000, 195000, 180000],
    inventory: 1800,
    screen_size: 'S18 (7.1mm)',
    processing_method: 'Natural (Phơi giàn tự nhiên)',
    origin_region: 'Đắk Lắk & Gia Lai',
    harvest_year: 'Vụ mùa mới nhất (Rang tươi theo tuần)',
    grading_spec: 'RO-S18 · Sàng 18 sạch tạp chất · Rang mới 100%',
    featured: 1,
  },
  {
    slug: 'roasted-beans-culi-s18',
    sku: 'RC-RBN-CUS18',
    gradeCode: 'CU-S18',
    barcode: generateEan13Barcode(9102),
    name_vi: 'CÀ PHÊ HẠT RANG CULI S18',
    name_en: 'ROASTED COFFEE BEANS CULI S18',
    subtitle_vi: 'Mã phẩm cấp CU-S18 · Hạt đơn tròn (Peaberry) rang mộc đậm đà chiều sâu',
    subtitle_en: 'Grade CU-S18 · Screen 18 Peaberry Whole Roasted Beans',
    description_vi:
      'Hạt Culi đơn nhân tròn trịa được phân tách riêng qua hệ thống sàng trọng lực kích thước S18, tích tụ hàm lượng caffeine và tinh dầu tự nhiên cao hơn hạt dẹt thông thường. Quá trình rang kiểm soát tốc độ tăng nhiệt chậm ở giai đoạn Maillard cho tách cà phê sánh đậm, hương ca cao nồng nàn và hậu vị ngọt sâu lý tưởng cho cả uống thuần hoặc phối blend cao cấp.',
    description_en:
      'Density-sorted Screen 18 Peaberry (single-seed cherry) beans naturally richer in caffeine and essential oils. Slow Maillard-phase roasting locks in intense syrupy body, pronounced roasted cocoa aromatics, and a lingering sweet finish suited for straight Phin brewing or premium signature blends.',
    coffee_type: '100% Culi / Peaberry S18 (Hạt rang nguyên chất)',
    blend_summary_vi: '100% Culi sàng 18 chọn lọc hạt tròn đồng nhất',
    blend_summary_en: '100% Screen 18 Peaberry · Uniform single-bean morphology',
    roast_profile_vi: 'Rang Đậm chuẩn mực (Full City Roast · Agtron ~45)',
    roast_profile_en: 'Full City Roast (Agtron ~45)',
    tasting_notes_vi: 'Ca cao đắng · Gỗ tuyết tùng · Mạch nha · Caffeine đậm sâu',
    tasting_notes_en: 'Bitter cocoa · Cedar spice · Dark malt · Concentrated body',
    brewing_methods: ['Vietnamese Phin', 'Espresso', 'Moka Pot', 'Iced Milk Coffee'],
    tierPricesVnd: [275000, 255000, 240000, 225000, 210000],
    inventory: 1200,
    screen_size: 'S18 Peaberry',
    processing_method: 'Natural (Thu hái chín chọn lọc)',
    origin_region: 'Đắk Lắk & Đắk Nông',
    harvest_year: 'Vụ mùa mới nhất (Rang tươi theo tuần)',
    grading_spec: 'CU-S18 · Culi sàng 18 tuyển chọn · Không độn bơ bắp',
    featured: 1,
  },
  {
    slug: 'roasted-beans-arabica-s18',
    sku: 'RC-RBN-ARS18',
    gradeCode: 'AR-S18',
    barcode: generateEan13Barcode(9103),
    name_vi: 'CÀ PHÊ HẠT RANG ARABICA S18',
    name_en: 'ROASTED COFFEE BEANS ARABICA S18',
    subtitle_vi: 'Mã phẩm cấp AR-S18 · Arabica Cầu Đất – Lâm Đồng hương hoa trái thanh tao',
    subtitle_en: 'Grade AR-S18 · Highland Arabica Screen 18 Whole Roasted Beans',
    description_vi:
      'Tuyển chọn từ những vườn Arabica Catimor vùng cao Cầu Đất – Lạc Dương (Lâm Đồng) ở độ cao 1.450–1.600m, hạt đạt chuẩn sàng lớn S18. Hồ sơ rang Vừa (Medium) giữ trọn độ chua trái cây sáng mịn, mùi hoa cà phê và hương caramel ngọt dịu — lý tưởng cho quầy Espresso Specialty, Pour-over hoặc phối tăng hương cho gu máy hiện đại.',
    description_en:
      'High-elevation Screen 18 Catimor Arabica grown across Cầu Đất and Lạc Dương (1,450–1,600m, Lâm Đồng). Roasted to a balanced Medium profile to showcase sparkling citrus acidity, coffee-blossom aromatics, and clean milk-chocolate sweetness for specialty espresso and filter bars.',
    coffee_type: '100% Arabica S18 (Hạt rang nguyên chất)',
    blend_summary_vi: '100% Arabica sàng 18 Cầu Đất – Lâm Đồng thuần chất',
    blend_summary_en: '100% Highland Arabica Screen 18 · Single-region origin',
    roast_profile_vi: 'Rang Vừa (Medium Roast · Agtron ~58)',
    roast_profile_en: 'Medium Roast (Agtron ~58)',
    tasting_notes_vi: 'Hoa nhài · Cam chín · Sô-cô-la sữa · Hậu ngọt thanh',
    tasting_notes_en: 'Jasmine blossom · Ripe citrus · Milk chocolate · Clean sweet finish',
    brewing_methods: ['Espresso', 'Pour-over', 'Cold Brew', 'French Press'],
    tierPricesVnd: [360000, 335000, 315000, 295000, 275000],
    inventory: 950,
    screen_size: 'S18 (7.1mm+)',
    processing_method: 'Washed / Natural Highland Lot',
    origin_region: 'Cầu Đất – Lâm Đồng',
    harvest_year: 'Vụ mùa mới nhất (Rang tươi theo tuần)',
    grading_spec: 'AR-S18 · Arabica sàng 18 tuyển chọn cao nguyên',
    featured: 1,
  },
  {
    slug: 'roasted-beans-arabica-s18-cbu',
    sku: 'RC-RBN-ARS18CBU',
    gradeCode: 'AR-S18-CBU',
    barcode: generateEan13Barcode(9104),
    name_vi: 'CÀ PHÊ HẠT RANG ARABICA S18 CBU',
    name_en: 'ROASTED COFFEE BEANS ARABICA S18 CBU',
    subtitle_vi: 'Mã phẩm cấp AR-S18-CBU · Arabica chế biến ướt (CBU) sạch vị tiêu chuẩn cao',
    subtitle_en: 'Grade AR-S18-CBU · Full-Washed Arabica Screen 18 Roasted Beans',
    description_vi:
      'Phiên bản Arabica S18 chế biến ướt hoàn toàn (CBU — Full Washed) lên men có kiểm soát trong bể sạch 18–24 giờ và rửa nước suối cao nguyên. Khi lên trống rang vừa-sáng, hạt cho tách cà phê cực kỳ trong trẻo, hậu vị sáng bừng nốt chanh vàng, quả mọng đỏ và mật ong thanh, đạt chuẩn khắt khe cho quầy Barista chuyên nghiệp và khách sạn 5 sao.',
    description_en:
      'Full-Washed (CBU) Screen 18 highland Arabica subjected to 18–24 hour controlled clean-tank fermentation. Medium-Light precision roasting highlights crystal clarity, bright lemon-verbena acidity, red berry notes, and crisp honeyed sweetness suited for specialty cafés and 5-star hospitality.',
    coffee_type: '100% Arabica S18 CBU (Chế biến ướt)',
    blend_summary_vi: '100% Arabica S18 chế biến ướt (CBU Washed) lên men kiểm soát',
    blend_summary_en: '100% Full-Washed CBU Arabica S18 · High-clarity lot',
    roast_profile_vi: 'Rang Sáng-Vừa (Light-Medium · Agtron ~62)',
    roast_profile_en: 'Light-Medium Roast (Agtron ~62)',
    tasting_notes_vi: 'Trà xanh hoa trắng · Chanh vàng · Mật ong · Vị sạch trong trẻo',
    tasting_notes_en: 'White tea floral · Meyer lemon · Wild honey · Crisp clarity',
    brewing_methods: ['Pour-over', 'Espresso', 'Cold Brew', 'French Press'],
    tierPricesVnd: [390000, 365000, 345000, 325000, 305000],
    inventory: 720,
    screen_size: 'S18 (7.1mm+)',
    processing_method: 'CBU (Full Washed)',
    origin_region: 'Cầu Đất – Lạc Dương (Lâm Đồng)',
    harvest_year: 'Vụ mùa mới nhất (Rang tươi theo tuần)',
    grading_spec: 'AR-S18-CBU · Chế biến ướt sạch tiêu chuẩn HORECA & Specialty',
    featured: 1,
  },
  {
    slug: 'roasted-beans-robusta-s18-cbu',
    sku: 'RC-RBN-ROS18CBU',
    gradeCode: 'RO-S18-CBU',
    barcode: generateEan13Barcode(9105),
    name_vi: 'CÀ PHÊ HẠT RANG ROBUSTA S18 CBU',
    name_en: 'ROASTED COFFEE BEANS ROBUSTA S18 CBU',
    subtitle_vi: 'Mã phẩm cấp RO-S18-CBU · Fine Robusta chế biến ướt sạch vị, ngọt hậu cho Espresso',
    subtitle_en: 'Grade RO-S18-CBU · Washed Fine Robusta S18 Roasted Beans',
    description_vi:
      'Dòng Fine Robusta sàng 18 chế biến ướt (CBU) loại bỏ hoàn toàn vị chát gắt và tạp mùi đất thường gặp ở Robusta phơi khô truyền thống. Nhờ quá trình tách vỏ thịt tươi và lên men kiểm soát, Robusta S18 CBU sau rang giữ được độ sánh dày ấn tượng, lớp crema mịn như nhung cùng vị sô-cô-la sữa và hạnh nhân mượt mà — lựa chọn hàng đầu cho quán Espresso hiện đại.',
    description_en:
      'Wet-processed (CBU) Fine Robusta Screen 18 crafted to eliminate harsh earthiness while maximizing sweetness and crema density. Fresh cherry pulping and controlled fermentation produce clean chocolate-almond smoothness with luxurious espresso mouthfeel—a favorite among modern espresso chains.',
    coffee_type: '100% Fine Robusta S18 CBU (Chế biến ướt)',
    blend_summary_vi: '100% Robusta sàng 18 chế biến ướt (CBU Washed) sạch vị cao cấp',
    blend_summary_en: '100% CBU Washed Fine Robusta S18 · Clean cup profile',
    roast_profile_vi: 'Rang Vừa (Medium Roast · Agtron ~52)',
    roast_profile_en: 'Medium Roast (Agtron ~52)',
    tasting_notes_vi: 'Sô-cô-la sữa · Hạnh nhân bùi · Mật mía · Crema mịn dày không gắt',
    tasting_notes_en: 'Milk chocolate · Toasted almond · Cane sugar · Smooth silky crema',
    brewing_methods: ['Espresso', 'Vietnamese Phin', 'Moka Pot', 'Iced Milk Coffee'],
    tierPricesVnd: [265000, 248000, 232000, 218000, 202000],
    inventory: 1500,
    screen_size: 'S18 (7.1mm)',
    processing_method: 'CBU (Full Washed Fine Robusta)',
    origin_region: 'Đắk Lắk & Lâm Đồng',
    harvest_year: 'Vụ mùa mới nhất (Rang tươi theo tuần)',
    grading_spec: 'RO-S18-CBU · Fine Robusta chế biến ướt chuẩn pha máy',
    featured: 1,
  },
  {
    slug: 'roasted-beans-robusta-s18-honey',
    sku: 'RC-RBN-ROS18HON',
    gradeCode: 'RO-S18-HONEY',
    barcode: generateEan13Barcode(9106),
    name_vi: 'CÀ PHÊ HẠT RANG ROBUSTA S18 HONEY',
    name_en: 'ROASTED COFFEE BEANS ROBUSTA S18 HONEY',
    subtitle_vi: 'Mã phẩm cấp RO-S18-HONEY · Robusta S18 chế biến mật ong ngọt đậm hương trái chín',
    subtitle_en: 'Grade RO-S18-HONEY · Honey-Processed Robusta S18 Roasted Beans',
    description_vi:
      'Quả cà phê Robusta chín đỏ 100% vùng Krông Năng – Đắk Lắk được xát vỏ giữ nguyên lớp nhầy mật ong (mucilage) và phơi giàn lưới nâng cao trong 16–20 ngày. Đường tự nhiên thẩm thấu sâu vào nhân giúp hạt Robusta S18 Honey sau rang tỏa hương mít chín nhẹ, caramel mật ong và sô-cô-la ngọt hậu — cân bằng hoàn hảo cho cả Phin đá lẫn Espresso.',
    description_en:
      '100% red-ripe Robusta cherries from Krông Năng – Đắk Lắk pulped with mucilage intact and slow-dried on raised beds for 16–20 days. Natural fruit sugars infuse the bean before roasting, yielding honeyed caramel richness, subtle ripe jackfruit sweetness, and rounded chocolate depth across Phin and Espresso.',
    coffee_type: '100% Robusta S18 Honey Process',
    blend_summary_vi: '100% Robusta sàng 18 chế biến Honey (Giữ lớp nhầy mật ong tự nhiên)',
    blend_summary_en: '100% Honey-Processed Robusta S18 · Raised-bed dried',
    roast_profile_vi: 'Rang Vừa-Đậm (Medium-Dark Honey Profile · Agtron ~50)',
    roast_profile_en: 'Medium-Dark Honey Roast (Agtron ~50)',
    tasting_notes_vi: 'Mật ong hoa cà phê · Caramel bơ · Mít chín dịu · Hậu ngọt kéo dài',
    tasting_notes_en: 'Coffee-blossom honey · Butterscotch · Subtle tropical fruit · Long sweet finish',
    brewing_methods: ['Espresso', 'Vietnamese Phin', 'Cold Brew', 'Iced Milk Coffee'],
    tierPricesVnd: [285000, 268000, 252000, 236000, 220000],
    inventory: 1350,
    screen_size: 'S18 (7.1mm)',
    processing_method: 'Honey Process (Phơi giàn nâng cao)',
    origin_region: 'Krông Năng – Đắk Lắk',
    harvest_year: 'Vụ mùa mới nhất (Rang tươi theo tuần)',
    grading_spec: 'RO-S18-HONEY · Chế biến mật ong 100% quả chín đỏ',
    featured: 1,
  },
];

const RETAIL_NEW_LINES_SEEDS: Array<{
  slug: string;
  sku: string;
  barcode: string;
  category: 'roasted' | 'roasted_beans' | 'instant' | 'pepper';
  sub_category: string;
  name_vi: string;
  name_en: string;
  subtitle_vi: string;
  subtitle_en: string;
  description_vi: string;
  description_en: string;
  coffee_type: string;
  blend_summary_vi: string;
  blend_summary_en: string;
  roast_profile_vi: string;
  roast_profile_en: string;
  tasting_notes_vi: string;
  tasting_notes_en: string;
  brewing_methods: string[];
  variant_label: string;
  unit_pack_label: string;
  price_vnd: number;
  inventory: number;
  moq: string;
  mascot_slug: string;
  screen_size: string;
  processing_method: string;
  origin_region: string;
  harvest_year: string;
  moisture_content: string;
  grading_spec: string;
  image_key: string;
  featured: number;
}> = [
  {
    slug: 'ca-phe-rang-xay-dam-500g',
    sku: 'RC-RX-DAM-500G',
    barcode: generateEan13Barcode(9201),
    category: 'roasted',
    sub_category: 'Rang xay 500g',
    name_vi: 'Cà Phê Rang Xay Đậm gói 500 G',
    name_en: 'ROAR Bold Ground Coffee 500g Pack',
    subtitle_vi: 'Gói 500g · Đậm vị truyền thống, hậu sô-cô-la đắng dịu chuẩn Phin Việt',
    subtitle_en: '500g Pack · Full-bodied traditional roast with rich cocoa depth',
    description_vi:
      'Cà Phê Rang Xay Đậm gói 500g được phối trộn và rang mộc 100% nhằm mang lại tách cà phê đen đá hoặc cà phê sữa đá đậm đà, dày vị, lưu hương lâu và không tẩm ướp hương liệu tổng hợp.',
    description_en:
      'Pure 100% drum-roasted Bold Ground Coffee in a 500g family pouch, crafted for intense Vietnamese iced black or condensed-milk phin coffee with clean lingering depth.',
    coffee_type: '500g Ground Roast',
    blend_summary_vi: 'Phối trộn Robusta & Culi rang đậm chuẩn gu Phin truyền thống',
    blend_summary_en: 'Bold Robusta & Culi dark roast for traditional Phin brewing',
    roast_profile_vi: 'Rang Đậm (Dark Roast)',
    roast_profile_en: 'Dark Roast',
    tasting_notes_vi: 'Đậm mạnh · Sô-cô-la đen · Đường nâu cháy · Hậu vị dày',
    tasting_notes_en: 'Full body · Dark chocolate · Caramelized sugar · Long finish',
    brewing_methods: ['Vietnamese Phin', 'Iced Milk Coffee', 'Moka Pot'],
    variant_label: 'Gói 500g',
    unit_pack_label: 'Gói 500g',
    price_vnd: 139000,
    inventory: 160,
    moq: '1 gói',
    mascot_slug: 'tiger',
    screen_size: 'S16/S18',
    processing_method: 'Natural & CBU',
    origin_region: 'Đắk Lắk – Tây Nguyên',
    harvest_year: 'Vụ mùa mới nhất',
    moisture_content: '≤ 5.0% (Rang xay)',
    grading_spec: 'Gói 500g van 1 chiều bảo quản hương',
    image_key: '/assets/roasted-ground/roar-dam-bold.jpg',
    featured: 1,
  },
  {
    slug: 'ca-phe-rang-xay-hai-hoa-500g',
    sku: 'RC-RX-HH-500G',
    barcode: generateEan13Barcode(9202),
    category: 'roasted',
    sub_category: 'Rang xay 500g',
    name_vi: 'Cà Phê Rang Xay Hài Hoà gói 500 G',
    name_en: 'ROAR Balanced Ground Coffee 500g Pack',
    subtitle_vi: 'Gói 500g · Cân bằng giữa vị đắng thanh và hương thơm dịu nhẹ mỗi ngày',
    subtitle_en: '500g Pack · Harmonized roast balancing smooth body and gentle sweetness',
    description_vi:
      'Cà Phê Rang Xay Hài Hoà gói 500g kết hợp cân đối giữa độ đậm của Robusta cao nguyên và nét thơm thanh từ Arabica, phù hợp uống hàng ngày tại gia đình và văn phòng.',
    description_en:
      'Balanced Ground Coffee 500g harmoniously blends highland Robusta richness with mellow Arabica aromatics for smooth everyday phin or drip cups.',
    coffee_type: '500g Ground Roast',
    blend_summary_vi: 'Phối trộn cân bằng Robusta & Arabica rang vừa-đậm',
    blend_summary_en: 'Balanced Robusta & Arabica medium-dark daily blend',
    roast_profile_vi: 'Rang Vừa-Đậm (Medium-Dark Roast)',
    roast_profile_en: 'Medium-Dark Roast',
    tasting_notes_vi: 'Hài hoà · Hạt dẻ rang · Ca cao sữa · Êm dịu dễ uống',
    tasting_notes_en: 'Balanced · Roasted hazelnut · Milk cocoa · Smooth finish',
    brewing_methods: ['Vietnamese Phin', 'Iced Milk Coffee', 'French Press'],
    variant_label: 'Gói 500g',
    unit_pack_label: 'Gói 500g',
    price_vnd: 149000,
    inventory: 150,
    moq: '1 gói',
    mascot_slug: 'lion',
    screen_size: 'S16/S18',
    processing_method: 'Washed & Natural',
    origin_region: 'Đắk Lắk & Lâm Đồng',
    harvest_year: 'Vụ mùa mới nhất',
    moisture_content: '≤ 5.0% (Rang xay)',
    grading_spec: 'Gói 500g van 1 chiều bảo quản hương',
    image_key: '/assets/roasted-ground/robusta-house-blend.jpg',
    featured: 0,
  },
  {
    slug: 'ca-phe-rang-xay-thom-500g',
    sku: 'RC-RX-THM-500G',
    barcode: generateEan13Barcode(9203),
    category: 'roasted',
    sub_category: 'Rang xay 500g',
    name_vi: 'Cà Phê Rang Xay Thơm gói 500 G',
    name_en: 'ROAR Aromatic Ground Coffee 500g Pack',
    subtitle_vi: 'Gói 500g · Hương hoa quả chín thanh tao, hậu ngọt dịu tinh tế',
    subtitle_en: '500g Pack · Elevated floral aroma with bright caramel sweetness',
    description_vi:
      'Cà Phê Rang Xay Thơm gói 500g tăng cường tỷ lệ hạt Arabica Cầu Đất rang ở mức vừa để bung tỏa nốt hương hoa cà phê, caramel và trái cây chín thanh lịch.',
    description_en:
      'Aromatic Ground Coffee 500g emphasizes highland Arabica roasted to Medium to highlight floral fragrance, caramel, and clean crisp sweetness.',
    coffee_type: '500g Ground Roast',
    blend_summary_vi: 'Tăng cường Arabica Cầu Đất cho tầng hương thơm nổi bật',
    blend_summary_en: 'Arabica-forward aromatic blend with sweet clean body',
    roast_profile_vi: 'Rang Vừa (Medium Roast)',
    roast_profile_en: 'Medium Roast',
    tasting_notes_vi: 'Hương hoa thơm · Caramel · Chua thanh dịu · Hậu ngọt',
    tasting_notes_en: 'Floral fragrance · Caramel · Gentle citrus · Sweet aftertaste',
    brewing_methods: ['Vietnamese Phin', 'Pour-over', 'French Press', 'Cold Brew'],
    variant_label: 'Gói 500g',
    unit_pack_label: 'Gói 500g',
    price_vnd: 159000,
    inventory: 140,
    moq: '1 gói',
    mascot_slug: 'fox',
    screen_size: 'S18 Selected',
    processing_method: 'CBU Washed & Honey',
    origin_region: 'Cầu Đất – Lâm Đồng',
    harvest_year: 'Vụ mùa mới nhất',
    moisture_content: '≤ 5.0% (Rang xay)',
    grading_spec: 'Gói 500g van 1 chiều bảo quản hương',
    image_key: '/assets/roasted-ground/arabica-selection.jpg',
    featured: 0,
  },
  {
    slug: 'ca-phe-rang-xay-espresso-500g',
    sku: 'RC-RX-ESP-500G',
    barcode: generateEan13Barcode(9204),
    category: 'roasted',
    sub_category: 'Rang xay 500g',
    name_vi: 'Cà Phê Rang Xay Espresso gói 500 G',
    name_en: 'ROAR Espresso Ground Coffee 500g Pack',
    subtitle_vi: 'Gói 500g · Độ mịn chuẩn máy pha Espresso, lớp crema dày mịn',
    subtitle_en: '500g Pack · Precision Espresso grind engineered for thick amber crema',
    description_vi:
      'Cà Phê Rang Xay Espresso gói 500g xay mịn chuẩn xác cho máy Espresso gia đình, văn phòng và ấm Moka Pot, cho lớp crema vàng hổ phách dày dặn và hậu vị sô-cô-la mượt mà.',
    description_en:
      'Precision-ground Espresso 500g pouch dialed for home espresso machines and Moka Pots, extracting thick tiger-striped crema and rich chocolate-nut notes.',
    coffee_type: '500g Ground Roast',
    blend_summary_vi: 'Phối trộn Espresso chuyên dụng cho pha máy & Moka Pot',
    blend_summary_en: 'Dedicated Espresso blend calibrated for pressure extraction',
    roast_profile_vi: 'Rang Espresso Tinh Chỉnh (Medium-Dark)',
    roast_profile_en: 'Medium-Dark Espresso',
    tasting_notes_vi: 'Crema dày · Sô-cô-la sữa · Hạnh nhân rang · Mật mía',
    tasting_notes_en: 'Thick crema · Milk chocolate · Toasted almond · Cane sugar',
    brewing_methods: ['Espresso', 'Moka Pot'],
    variant_label: 'Gói 500g (Xay Espresso)',
    unit_pack_label: 'Gói 500g',
    price_vnd: 199000,
    inventory: 130,
    moq: '1 gói',
    mascot_slug: 'eagle',
    screen_size: 'S18 Selected',
    processing_method: 'CBU Washed',
    origin_region: 'Lâm Đồng & Đắk Lắk',
    harvest_year: 'Vụ mùa mới nhất',
    moisture_content: '≤ 5.0% (Rang xay)',
    grading_spec: 'Gói 500g xay chuẩn Espresso áp suất 9 bar',
    image_key: '/assets/roasted-ground/roar-espresso.jpg',
    featured: 1,
  },
  {
    slug: 'ca-phe-hat-arabica-200g',
    sku: 'RC-HAT-AR-200G',
    barcode: generateEan13Barcode(9205),
    category: 'roasted_beans',
    sub_category: 'Hạt rang 200g',
    name_vi: 'Cà Phê Hạt Arabica túi 200 G',
    name_en: 'Roasted Arabica Whole Beans 200g Pouch',
    subtitle_vi: 'Túi 200g · 100% Hạt Arabica nguyên chất rang vừa, giữ trọn hương hoa quả',
    subtitle_en: '200g Pouch · 100% Pure Highland Arabica whole beans, medium roast',
    description_vi:
      'Cà Phê Hạt Arabica túi 200g tiện lợi cho người thích tự xay tươi mỗi sáng tại nhà bằng cối xay tay hoặc máy pha tự động, mang hương hoa nhài, cam chín và hậu vị thanh sạch.',
    description_en:
      'Convenient 200g whole-bean Arabica pouch crafted for fresh home grinding, unlocking jasmine aromatics, gentle citrus brightness, and sweet honeyed clarity.',
    coffee_type: '200g Whole Bean',
    blend_summary_vi: '100% Hạt rang Arabica Cầu Đất nguyên chất',
    blend_summary_en: '100% Pure Cầu Đất Highland Arabica whole beans',
    roast_profile_vi: 'Rang Vừa (Medium Roast)',
    roast_profile_en: 'Medium Roast',
    tasting_notes_vi: 'Hoa nhài · Cam chín · Mật ong · Vị chua thanh tinh tế',
    tasting_notes_en: 'Jasmine blossom · Ripe orange · Honey · Clean acidity',
    brewing_methods: ['Pour-over', 'Espresso', 'Cold Brew', 'French Press'],
    variant_label: 'Túi 200g (Hạt nguyên chất)',
    unit_pack_label: 'Gói / Túi 200g',
    price_vnd: 119000,
    inventory: 180,
    moq: '1 gói',
    mascot_slug: 'fox',
    screen_size: 'S18 Selected',
    processing_method: 'CBU Washed',
    origin_region: 'Cầu Đất – Lâm Đồng',
    harvest_year: 'Vụ mùa mới nhất',
    moisture_content: '≤ 4.5% (Hạt rang)',
    grading_spec: 'Túi 200g nguyên hạt giữ hương tươi mới',
    image_key: '/assets/roasted-beans/arabica-s18.jpg',
    featured: 1,
  },
  {
    slug: 'ca-phe-hat-robusta-200g',
    sku: 'RC-HAT-RO-200G',
    barcode: generateEan13Barcode(9206),
    category: 'roasted_beans',
    sub_category: 'Hạt rang 200g',
    name_vi: 'Cà Phê Hạt Robusta túi 200 G',
    name_en: 'Roasted Robusta Whole Beans 200g Pouch',
    subtitle_vi: 'Túi 200g · 100% Hạt Robusta Tây Nguyên rang mộc, body dày crema đậm',
    subtitle_en: '200g Pouch · 100% Pure Highland Robusta whole beans, rich crema',
    description_vi:
      'Cà Phê Hạt Robusta túi 200g mang nguồn năng lượng đậm đà từ vùng bazan Đắk Lắk. Phù hợp tự xay pha Phin hoặc phối cùng Arabica theo tỷ lệ gu riêng tại nhà.',
    description_en:
      'Pure highland Robusta whole beans in a compact 200g pouch delivering heavy cocoa body, sturdy crema, and bold morning energy for custom home grinding.',
    coffee_type: '200g Whole Bean',
    blend_summary_vi: '100% Hạt rang Robusta Đắk Lắk nguyên chất',
    blend_summary_en: '100% Pure Đắk Lắk Robusta whole beans',
    roast_profile_vi: 'Rang Vừa-Đậm (Medium-Dark Roast)',
    roast_profile_en: 'Medium-Dark Roast',
    tasting_notes_vi: 'Sô-cô-la đen · Hạt dẻ rang · Đậm caffeine · Crema dày',
    tasting_notes_en: 'Dark chocolate · Roasted nut · Bold caffeine · Dense crema',
    brewing_methods: ['Vietnamese Phin', 'Espresso', 'Moka Pot'],
    variant_label: 'Túi 200g (Hạt nguyên chất)',
    unit_pack_label: 'Gói / Túi 200g',
    price_vnd: 109000,
    inventory: 200,
    moq: '1 gói',
    mascot_slug: 'tiger',
    screen_size: 'S18 Selected',
    processing_method: 'Natural',
    origin_region: 'Đắk Lắk – Tây Nguyên',
    harvest_year: 'Vụ mùa mới nhất',
    moisture_content: '≤ 4.5% (Hạt rang)',
    grading_spec: 'Túi 200g nguyên hạt không tẩm ướp',
    image_key: '/assets/roasted-beans/robusta-s18.jpg',
    featured: 0,
  },
  {
    slug: 'ca-phe-hat-culi-200g',
    sku: 'RC-HAT-CU-200G',
    barcode: generateEan13Barcode(9207),
    category: 'roasted_beans',
    sub_category: 'Hạt rang 200g',
    name_vi: 'Cà Phê Hạt Culi gói 200 G',
    name_en: 'Roasted Culi Peaberry Beans 200g Pack',
    subtitle_vi: 'Gói 200g · Hạt đơn tròn tuyển chọn, vị đậm sâu và hàm lượng tinh dầu cao',
    subtitle_en: '200g Pack · Single-bean Peaberry whole beans with intense syrupy finish',
    description_vi:
      'Cà Phê Hạt Culi gói 200g tuyển lọc những hạt cà phê đơn nhân tròn (Peaberry) có độ sánh đậm và hậu vị ca cao trầm sâu hơn hạt dẹt thông thường.',
    description_en:
      'Carefully sorted single-seed Peaberry (Culi) whole beans in a 200g pack, prized for syrupy concentration, dark cocoa depth, and bold caffeine lift.',
    coffee_type: '200g Whole Bean',
    blend_summary_vi: '100% Hạt rang Culi Peaberry tuyển chọn',
    blend_summary_en: '100% Selected Culi Peaberry whole roasted beans',
    roast_profile_vi: 'Rang Đậm Chuẩn Mực (Full City)',
    roast_profile_en: 'Full City Roast',
    tasting_notes_vi: 'Ca cao đắng · Gỗ tuyết tùng · Hậu ngọt sâu · Sánh đậm',
    tasting_notes_en: 'Bitter cocoa · Cedar · Lingering sweet finish · Syrupy body',
    brewing_methods: ['Vietnamese Phin', 'Espresso', 'Iced Milk Coffee'],
    variant_label: 'Gói 200g (Hạt Culi nguyên chất)',
    unit_pack_label: 'Gói 200g',
    price_vnd: 99000,
    inventory: 190,
    moq: '1 gói',
    mascot_slug: 'black-panther',
    screen_size: 'S18 Peaberry',
    processing_method: 'Natural',
    origin_region: 'Đắk Lắk & Đắk Nông',
    harvest_year: 'Vụ mùa mới nhất',
    moisture_content: '≤ 4.5% (Hạt rang)',
    grading_spec: 'Gói 200g hạt tròn Culi tuyển chọn',
    image_key: '/assets/roasted-beans/culi-s18.jpg',
    featured: 0,
  },
  {
    slug: 'ca-phe-hoa-tan-3in1-hop-10-goi',
    sku: 'RC-HT-3IN1-10X17G',
    barcode: generateEan13Barcode(9208),
    category: 'instant',
    sub_category: 'Hòa tan 3in1',
    name_vi: 'Cà Phê Hoà Tan 3in1 hộp 10 gói x 17 G',
    name_en: '3in1 Instant Coffee (Box 10 Sticks x 17g)',
    subtitle_vi: 'Hộp 10 gói × 17g · Hòa tan tiện lợi, béo dịu hài hòa pha nóng hoặc đá trong 10 giây',
    subtitle_en: 'Box 10 × 17g · Smooth balanced 3in1 soluble blend for hot or iced cups',
    description_vi:
      'Cà Phê Hoà Tan 3in1 hộp 10 gói × 17g kết hợp tinh chất cà phê rang xay cùng kem sữa và đường theo tỷ lệ cân đối, mang lại ly cà phê sữa thơm ngậy chuẩn vị Việt mọi lúc mọi nơi.',
    description_en:
      'Box of 10 × 17g 3in1 Instant Coffee sticks uniting roasted soluble coffee extract, silky creamer, and balanced sweetness for instant hot or iced satisfaction.',
    coffee_type: '3in1 Instant Coffee',
    blend_summary_vi: 'Cà phê hòa tan 3in1 tỷ lệ hài hòa 17g/gói',
    blend_summary_en: 'Balanced 3in1 instant formulation (17g per stick)',
    roast_profile_vi: 'Chiết xuất Hòa tan 3in1',
    roast_profile_en: 'Soluble 3in1 Extraction',
    tasting_notes_vi: 'Thơm cà phê · Béo sữa dịu · Ngọt thanh vừa vặn',
    tasting_notes_en: 'Roasted aroma · Smooth creaminess · Balanced sweetness',
    brewing_methods: ['Hot Water (70–80°C)', 'Iced Coffee'],
    variant_label: 'Hộp 10 gói × 17g',
    unit_pack_label: 'Hộp 10 gói × 17g',
    price_vnd: 59000,
    inventory: 240,
    moq: '1 hộp',
    mascot_slug: 'fox',
    screen_size: 'N/A',
    processing_method: 'Soluble 3in1',
    origin_region: 'Việt Nam',
    harvest_year: 'Sản xuất mới nhất',
    moisture_content: '≤ 4.0%',
    grading_spec: 'Hộp 10 gói × 17g (Khối lượng tịnh 170g)',
    image_key: 'instant_3in1_box_chill',
    featured: 1,
  },
  {
    slug: 'ca-phe-hoa-tan-3in1-tui-45-goi',
    sku: 'RC-HT-3IN1-45X17G',
    barcode: generateEan13Barcode(9209),
    category: 'instant',
    sub_category: 'Hòa tan 3in1',
    name_vi: 'Cà Phê Hoà Tan 3in1 túi 45 gói x 17 G',
    name_en: '3in1 Instant Coffee Family Pouch (45 Sticks x 17g)',
    subtitle_vi: 'Túi lớn 45 gói × 17g · Tiết kiệm vượt trội cho gia đình và pantry văn phòng',
    subtitle_en: '45 × 17g Economy Pouch · Value pack for households and office pantries',
    description_vi:
      'Túi tiết kiệm 45 gói Cà Phê Hoà Tan 3in1 (45 × 17g) giúp duy trì thói quen thưởng thức cà phê sữa nhanh gọn mỗi ngày tại nhà, công ty và quầy pantry với mức giá tối ưu.',
    description_en:
      'Family & office value pack of 45 × 17g 3in1 Instant Coffee sticks, keeping rich, creamy Vietnamese coffee ready in seconds at significant per-cup savings.',
    coffee_type: '3in1 Instant Coffee',
    blend_summary_vi: 'Túi lớn 45 gói Cà phê hòa tan 3in1 (765g)',
    blend_summary_en: 'Large 45-stick 3in1 instant coffee pack (765g net)',
    roast_profile_vi: 'Chiết xuất Hòa tan 3in1',
    roast_profile_en: 'Soluble 3in1 Extraction',
    tasting_notes_vi: 'Đậm hương cà phê · Sữa béo hài hòa · Pha nóng/đá đều ngon',
    tasting_notes_en: 'Fragrant roast · Velvety milk balance · Great hot or iced',
    brewing_methods: ['Hot Water (70–80°C)', 'Iced Coffee'],
    variant_label: 'Túi 45 gói × 17g',
    unit_pack_label: 'Túi 45 gói × 17g',
    price_vnd: 239000,
    inventory: 150,
    moq: '1 túi',
    mascot_slug: 'lion',
    screen_size: 'N/A',
    processing_method: 'Soluble 3in1',
    origin_region: 'Việt Nam',
    harvest_year: 'Sản xuất mới nhất',
    moisture_content: '≤ 4.0%',
    grading_spec: 'Túi 45 gói × 17g (Khối lượng tịnh 765g)',
    image_key: 'instant_3in1_pouch_45_chill',
    featured: 1,
  },
  {
    slug: 'ca-phe-muoi-hop-10-goi',
    sku: 'RC-HT-MUOI-10X18G',
    barcode: generateEan13Barcode(9210),
    category: 'instant',
    sub_category: 'Cà phê Muối',
    name_vi: 'Cà Phê Muối hộp 10 gói x 18 G',
    name_en: 'Vietnamese Salted Instant Coffee (Box 10 Sticks x 18g)',
    subtitle_vi: 'Hộp 10 gói × 18g · Vị kem béo mằn mặn đặc trưng hòa quyện cà phê rang đậm',
    subtitle_en: 'Box 10 × 18g · Signature salted cream harmony over rich roasted coffee',
    description_vi:
      'Cà Phê Muối hộp 10 gói × 18g tái hiện hương vị cà phê muối trứ danh với lớp kem béo mằn mặn tinh tế giúp tôn bật vị ngọt hậu và giảm gắt đắng ngay trong 1 bước pha nhanh.',
    description_en:
      'Inspired by Hue’s iconic salted coffee, each 18g stick blends rich soluble roast with delicate savory sea-salt creaminess that amplifies sweetness and silkiness.',
    coffee_type: 'Salted Coffee',
    blend_summary_vi: 'Cà phê muối hòa tan chuẩn vị béo mặn hài hòa (18g/gói)',
    blend_summary_en: 'Salted coffee instant formulation (18g per stick)',
    roast_profile_vi: 'Hòa tan Phối Kem Muối',
    roast_profile_en: 'Salted Cream Soluble Blend',
    tasting_notes_vi: 'Mặn dịu đầu lưỡi · Béo kem mịn · Cà phê đậm ngọt hậu',
    tasting_notes_en: 'Subtle sea-salt lift · Silky cream · Rich sweet coffee finish',
    brewing_methods: ['Hot Water (70–80°C)', 'Iced Coffee'],
    variant_label: 'Hộp 10 gói × 18g',
    unit_pack_label: 'Hộp 10 gói × 18g',
    price_vnd: 59000,
    inventory: 220,
    moq: '1 hộp',
    mascot_slug: 'owl',
    screen_size: 'N/A',
    processing_method: 'Soluble Salted Cream',
    origin_region: 'Việt Nam',
    harvest_year: 'Sản xuất mới nhất',
    moisture_content: '≤ 4.0%',
    grading_spec: 'Hộp 10 gói × 18g (Khối lượng tịnh 180g)',
    image_key: 'instant_salted_coffee_chill',
    featured: 1,
  },
  {
    slug: 'tieu-den-xay-45g',
    sku: 'RC-TIEU-DX-45G',
    barcode: generateEan13Barcode(9211),
    category: 'pepper',
    sub_category: 'Tiêu Đen Xay',
    name_vi: 'Tiêu Đen Xay 45 G',
    name_en: 'Highland Ground Black Pepper 45g Jar',
    subtitle_vi: 'Hũ 45g · Tiêu đen Tây Nguyên xay mịn nguyên chất 100%, cay thơm nồng ấm',
    subtitle_en: '45g Jar · 100% pure Central Highlands ground black pepper',
    description_vi:
      'Tiêu Đen Xay 45g được chế biến từ những chùm hạt tiêu đen chín chọn lọc vùng đất đỏ bazan Tây Nguyên, làm sạch và xay mịn đóng hũ tiện dụng, giữ trọn tinh dầu cay thơm tự nhiên cho gian bếp gia đình.',
    description_en:
      '100% pure ground black pepper harvested from Central Highlands basalt farms, milled fine and sealed in a 45g pantry jar to lock in warm pungency and vibrant aroma.',
    coffee_type: 'Ground Black Pepper',
    blend_summary_vi: '100% Tiêu đen Tây Nguyên nguyên chất không pha tạp',
    blend_summary_en: '100% Pure Highland Black Pepper · No fillers',
    roast_profile_vi: 'Phơi sạch & Xay mịn',
    roast_profile_en: 'Sun-dried & Finely Ground',
    tasting_notes_vi: 'Cay ấm đặc trưng · Tinh dầu thơm nồng · Sạch tạp chất',
    tasting_notes_en: 'Warm piperine heat · Fragrant essential oils · Clean milled',
    brewing_methods: [],
    variant_label: 'Hũ 45g',
    unit_pack_label: 'Hũ 45g',
    price_vnd: 29000,
    inventory: 300,
    moq: '1 hũ',
    mascot_slug: '',
    screen_size: 'Xay mịn',
    processing_method: 'Clean Sun-Dried & Milled',
    origin_region: 'Đắk Lắk & Gia Lai',
    harvest_year: 'Vụ mùa mới nhất',
    moisture_content: '≤ 12.0%',
    grading_spec: 'Hũ nắp vặn kín hương 45g',
    image_key: 'pepper_ground_black_jar',
    featured: 0,
  },
  {
    slug: 'tieu-den-xay-90g',
    sku: 'RC-TIEU-DX-90G',
    barcode: generateEan13Barcode(9212),
    category: 'pepper',
    sub_category: 'Tiêu Đen Xay',
    name_vi: 'Tiêu Đen Xay 90 G',
    name_en: 'Highland Ground Black Pepper 90g Jar',
    subtitle_vi: 'Hũ lớn 90g · Tiêu đen xay mịn nguyên chất cho bếp ăn và nhà hàng',
    subtitle_en: '90g Jar · Value kitchen jar of pure Highland ground black pepper',
    description_vi:
      'Tiêu Đen Xay hũ 90g gấp đôi dung tích tiện lợi cho nhu cầu nêm nếm, tẩm ướp hằng ngày của gia đình và bếp chuyên nghiệp. 100% hạt tiêu sạch Tây Nguyên giàu hương vị tự nhiên.',
    description_en:
      'Double-size 90g jar of 100% pure Central Highlands ground black pepper tailored for daily family cooking, marinades, and culinary kitchens.',
    coffee_type: 'Ground Black Pepper',
    blend_summary_vi: '100% Tiêu đen Tây Nguyên nguyên chất hũ lớn 90g',
    blend_summary_en: '100% Pure Highland Black Pepper (90g jar)',
    roast_profile_vi: 'Phơi sạch & Xay mịn',
    roast_profile_en: 'Sun-dried & Finely Ground',
    tasting_notes_vi: 'Cay nồng tự nhiên · Dậy mùi món ướp · Hạt sạch đồng nhất',
    tasting_notes_en: 'Natural pungency · Bold marinade aroma · Clean uniform grind',
    brewing_methods: [],
    variant_label: 'Hũ 90g',
    unit_pack_label: 'Hũ 90g',
    price_vnd: 58000,
    inventory: 240,
    moq: '1 hũ',
    mascot_slug: '',
    screen_size: 'Xay mịn',
    processing_method: 'Clean Sun-Dried & Milled',
    origin_region: 'Đắk Lắk & Gia Lai',
    harvest_year: 'Vụ mùa mới nhất',
    moisture_content: '≤ 12.0%',
    grading_spec: 'Hũ lớn 90g nắp kín bảo quản lâu dài',
    image_key: 'pepper_ground_black_jar',
    featured: 0,
  },
  {
    slug: 'tieu-den-so-45g',
    sku: 'RC-TIEU-SO-45G',
    barcode: generateEan13Barcode(9213),
    category: 'pepper',
    sub_category: 'Tiêu Sọ',
    name_vi: 'Tiêu Đen Sọ 45 G',
    name_en: 'Highland White / Hulled Black Pepper 45g Jar',
    subtitle_vi: 'Hũ 45g · Tiêu sọ bỏ vỏ chọn lọc từ hạt chín đỏ, thơm thanh tinh khiết',
    subtitle_en: '45g Jar · Selected hulled pepper with refined aroma and clean heat',
    description_vi:
      'Tiêu Đen Sọ 45g được làm từ hạt tiêu chín mọng đã loại bỏ lớp vỏ lụa bên ngoài, cho sắc màu sáng đẹp cùng vị cay thanh sâu, ít chát vỏ, hoàn hảo cho súp, đồ hấp và sốt kem.',
    description_en:
      'Crafted from fully ripe berries with outer skins gently removed, this 45g hulled pepper jar delivers refined warmth and luminous appearance for broths and delicate sauces.',
    coffee_type: 'White / Hulled Pepper',
    blend_summary_vi: '100% Tiêu sọ tuyển chọn sạch vỏ',
    blend_summary_en: '100% Selected Hulled Peppercorns',
    roast_profile_vi: 'Tách vỏ sạch & Sấy tự nhiên',
    roast_profile_en: 'Hulled & Naturally Dried',
    tasting_notes_vi: 'Thơm thanh · Cay dịu sâu · Màu sáng đẹp không làm sẫm món ăn',
    tasting_notes_en: 'Refined aroma · Clean gentle heat · Bright culinary finish',
    brewing_methods: [],
    variant_label: 'Hũ 45g',
    unit_pack_label: 'Hũ 45g',
    price_vnd: 35000,
    inventory: 220,
    moq: '1 hũ',
    mascot_slug: '',
    screen_size: 'Hạt sọ tuyển chọn',
    processing_method: 'Water-Retted & Hulled',
    origin_region: 'Tây Nguyên Việt Nam',
    harvest_year: 'Vụ mùa mới nhất',
    moisture_content: '≤ 12.0%',
    grading_spec: 'Hũ 45g tiêu sọ sạch cao cấp',
    image_key: 'pepper_hulled_white_jar',
    featured: 0,
  },
  {
    slug: 'tieu-den-so-90g',
    sku: 'RC-TIEU-SO-90G',
    barcode: generateEan13Barcode(9214),
    category: 'pepper',
    sub_category: 'Tiêu Sọ',
    name_vi: 'Tiêu Đen Sọ 90 G',
    name_en: 'Highland White / Hulled Black Pepper 90g Jar',
    subtitle_vi: 'Hũ lớn 90g · Tiêu sọ tinh khiết dịu hương cho gian bếp và đầu bếp',
    subtitle_en: '90g Jar · Large culinary jar of selected hulled white pepper',
    description_vi:
      'Tiêu Đen Sọ hũ 90g dành cho người yêu sự tinh tế trong chế biến món Á – Âu: không chỉ dậy mùi thơm thanh khiết mà còn giữ trọn sắc trắng đẹp mắt cho nước dùng và nước chấm.',
    description_en:
      'Generous 90g jar of cleanly hulled highland pepper built for chefs and home cooks seeking delicate spice warmth without darkening light broths or cream sauces.',
    coffee_type: 'White / Hulled Pepper',
    blend_summary_vi: '100% Tiêu sọ tuyển chọn hũ 90g',
    blend_summary_en: '100% Selected Hulled Peppercorns (90g jar)',
    roast_profile_vi: 'Tách vỏ sạch & Sấy tự nhiên',
    roast_profile_en: 'Hulled & Naturally Dried',
    tasting_notes_vi: 'Thơm dịu tinh tế · Cay ấm kéo dài · Sạch sẽ an toàn',
    tasting_notes_en: 'Delicate fragrance · Smooth warm finish · Pure single-origin',
    brewing_methods: [],
    variant_label: 'Hũ 90g',
    unit_pack_label: 'Hũ 90g',
    price_vnd: 69000,
    inventory: 190,
    moq: '1 hũ',
    mascot_slug: '',
    screen_size: 'Hạt sọ tuyển chọn',
    processing_method: 'Water-Retted & Hulled',
    origin_region: 'Tây Nguyên Việt Nam',
    harvest_year: 'Vụ mùa mới nhất',
    moisture_content: '≤ 12.0%',
    grading_spec: 'Hũ 90g nắp kín giữ hương tiêu sọ',
    image_key: 'pepper_hulled_white_jar',
    featured: 0,
  },
  {
    slug: 'tieu-den-hat-coi-xay-70g',
    sku: 'RC-TIEU-DCX-70G',
    barcode: generateEan13Barcode(9215),
    category: 'pepper',
    sub_category: 'Tiêu Cối Xay',
    name_vi: 'Tiêu Đen Hạt Cối Xay 70 G',
    name_en: 'Whole Black Peppercorns Grinder Jar 70g',
    subtitle_vi: 'Hũ Cối Xay 70g · Hạt tiêu đen mẩy sàng lớn kèm nắp cối xay tươi trực tiếp tại bàn',
    subtitle_en: '70g Grinder Jar · Bold whole black peppercorns with built-in fresh mill',
    description_vi:
      'Tiêu Đen Hạt Cối Xay 70g kết hợp những hạt tiêu đen Tây Nguyên chắc mẩy cùng hũ thủy tinh nắp cối xay bền bỉ — giúp bạn xoay và rắc tiêu tươi trực tiếp lên bít tết, salad hay phở để giữ 100% tinh dầu vừa giải phóng.',
    description_en:
      'Bold sun-dried highland black peppercorns packed inside a glass grinder jar so every twist releases freshly cracked essential oils directly onto steaks, grilled meats, and soups.',
    coffee_type: 'Black Peppercorns Grinder',
    blend_summary_vi: '100% Hạt tiêu đen mẩy nguyên hạt + Cối xay thủy tinh 70g',
    blend_summary_en: '100% Bold whole black peppercorns with glass grinder mill (70g)',
    roast_profile_vi: 'Nguyên hạt sàng lớn Sạch 100%',
    roast_profile_en: 'Whole Graded Black Peppercorns',
    tasting_notes_vi: 'Thơm bùng nổ khi xay tươi · Cay nồng đậm đà · Tiện dụng tại bàn',
    tasting_notes_en: 'Freshly cracked aroma burst · Robust heat · Table-ready grinder',
    brewing_methods: [],
    variant_label: 'Hũ Cối Xay 70g',
    unit_pack_label: 'Hũ Cối Xay 70g',
    price_vnd: 79000,
    inventory: 170,
    moq: '1 hũ',
    mascot_slug: '',
    screen_size: 'Hạt mẩy ≥ 4.5mm',
    processing_method: 'Sun-Dried Whole Graded',
    origin_region: 'Đắk Lắk & Gia Lai',
    harvest_year: 'Vụ mùa mới nhất',
    moisture_content: '≤ 12.0%',
    grading_spec: 'Hũ thủy tinh kèm đầu cối xay 70g',
    image_key: 'pepper_black_grinder_jar',
    featured: 1,
  },
  {
    slug: 'tieu-so-hat-coi-xay-70g',
    sku: 'RC-TIEU-SCX-70G',
    barcode: generateEan13Barcode(9216),
    category: 'pepper',
    sub_category: 'Tiêu Cối Xay',
    name_vi: 'Tiêu Sọ Hạt Cối Xay 70 G',
    name_en: 'Whole White Peppercorns Grinder Jar 70g',
    subtitle_vi: 'Hũ Cối Xay 70g · Tiêu sọ nguyên hạt cao cấp kèm đầu xay tươi chuẩn bàn ăn',
    subtitle_en: '70g Grinder Jar · Whole white peppercorns with built-in precision mill',
    description_vi:
      'Tiêu Sọ Hạt Cối Xay 70g tuyển chọn những hạt tiêu sọ tròn đều đẹp mắt từ quả chín đỏ Tây Nguyên, đóng trong hũ thủy tinh nắp cối xay cao cấp để mang lại trải nghiệm nêm nếm tinh tế chuẩn nhà hàng.',
    description_en:
      'Premium whole white peppercorns inside an integrated glass grinder mill—cracking fresh, aromatic warmth at the table without discoloring delicate dishes.',
    coffee_type: 'White Peppercorns Grinder',
    blend_summary_vi: '100% Tiêu sọ nguyên hạt chọn lọc + Cối xay thủy tinh 70g',
    blend_summary_en: '100% Whole white peppercorns with glass grinder mill (70g)',
    roast_profile_vi: 'Nguyên hạt Tiêu sọ chọn lọc',
    roast_profile_en: 'Whole Graded White Peppercorns',
    tasting_notes_vi: 'Hương thơm thanh tao · Cay ấm sâu · Xay trực tiếp không mất mùi',
    tasting_notes_en: 'Clean floral spice · Warm finish · Fresh table-cracked mill',
    brewing_methods: [],
    variant_label: 'Hũ Cối Xay 70g',
    unit_pack_label: 'Hũ Cối Xay 70g',
    price_vnd: 89000,
    inventory: 160,
    moq: '1 hũ',
    mascot_slug: '',
    screen_size: 'Hạt sọ tròn chọn lọc',
    processing_method: 'Water-Retted & Hulled Whole',
    origin_region: 'Tây Nguyên Việt Nam',
    harvest_year: 'Vụ mùa mới nhất',
    moisture_content: '≤ 12.0%',
    grading_spec: 'Hũ thủy tinh kèm đầu cối xay 70g',
    image_key: 'pepper_white_grinder_jar',
    featured: 1,
  },
];
