import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { RRule, rrulestr } from 'rrule'

/**
 * RecurrenceRule — RFC 5545 RRULE 文字列のバリューオブジェクト
 *
 * rrule ライブラリを用いて解析・展開する。
 */
export class RecurrenceRule {
    private constructor(
        private readonly value: string,
        private readonly rrule: RRule,
    ) { }

    /**
     * RRULE 文字列からインスタンスを生成。バリデーション付き。
     * 例: "FREQ=WEEKLY;BYDAY=MO,WE,FR"
     */
    static create(ruleString: string): RecurrenceRule {
        try {
            const rule = rrulestr(ruleString)
            return new RecurrenceRule(ruleString, rule)
        } catch {
            throw new DomainValidationError(
                `無効なRecurrenceRuleです: ${ruleString}`,
                'INVALID_RECURRENCE_RULE',
            )
        }
    }

    /** DB 復元用 */
    static reconstruct(ruleString: string): RecurrenceRule {
        const rule = rrulestr(ruleString)
        return new RecurrenceRule(ruleString, rule)
    }

    /** DB に保存可能 */
    static createNullable(ruleString: string | null | undefined): RecurrenceRule | null {
        if (!ruleString) return null
        return RecurrenceRule.create(ruleString)
    }

    getValue(): string {
        return this.value
    }

    /**
     * from〜to の期間でスケジュール日を生成
     */
    between(from: Date, to: Date): Date[] {
        return this.rrule.between(from, to, true)
    }

    /**
     * 次の N 個のオカレンスを取得
     */
    nextOccurrences(count: number, after?: Date): Date[] {
        const all = this.rrule.all((_date, i) => i < count)
        if (after) {
            return all.filter(d => d > after)
        }
        return all
    }
}
