package ai.platon.pulsar.dom.select

import org.jsoup.internal.StringUtil
import org.jsoup.nodes.Element
import org.jsoup.select.Evaluator
import java.util.*

/**
 * Base combining (and, or) evaluator.
 */
internal abstract class CombiningEvaluator() : Evaluator() {
    val evaluators: ArrayList<Evaluator> = ArrayList()
    var num = 0

    constructor(evaluators: Collection<Evaluator>) : this() {
        this.evaluators.addAll(evaluators)
        updateNumEvaluators()
    }

    fun rightMostEvaluator(): Evaluator? {
        return if (num > 0) evaluators[num - 1] else null
    }

    fun replaceRightMostEvaluator(replacement: Evaluator) {
        evaluators[num - 1] = replacement
    }

    fun updateNumEvaluators() { // used so we don't need to bash on size() for every match test
        num = evaluators.size
    }

    internal class And(evaluators: Collection<Evaluator>) : CombiningEvaluator(evaluators) {
        constructor(vararg evaluators: Evaluator) : this(listOf(*evaluators))

        override fun matches(root: Element, node: Element): Boolean {
            for (i in 0 until num) {
                val s = evaluators[i]
                if (!s.matches(root, node)) return false
            }
            return true
        }

        override fun toString(): String {
            return StringUtil.join(evaluators, " ")
        }
    }

    internal class Or : CombiningEvaluator {
        /**
         * Create a new Or evaluator. The initial evaluators are ANDed together and used as the first clause of the OR.
         * @param evaluators initial OR clause (these are wrapped into an AND evaluator).
         */
        constructor(evaluators: Collection<Evaluator>) : super() {
            if (num > 1) this.evaluators.add(And(evaluators)) else  // 0 or 1
                this.evaluators.addAll(evaluators)
            updateNumEvaluators()
        }

        constructor(vararg evaluators: Evaluator) : this(listOf(*evaluators)) {}
        constructor(): super()

        fun add(e: Evaluator) {
            evaluators.add(e)
            updateNumEvaluators()
        }

        override fun matches(root: Element, node: Element): Boolean {
            for (i in 0 until num) {
                val s = evaluators[i]
                if (s.matches(root, node)) return true
            }
            return false
        }

        override fun toString(): String {
            return StringUtil.join(evaluators, ", ")
        }
    }

}
