package ai.platon.pulsar.dom

import ai.platon.pulsar.common.ResourceLoader
import ai.platon.pulsar.dom.nodes.node.ext.depth
import ai.platon.pulsar.dom.nodes.node.ext.uniqueName
import ai.platon.pulsar.dom.select.BackwardNodeTraversor
import org.jsoup.nodes.Element
import org.jsoup.nodes.Node
import org.jsoup.select.NodeFilter
import org.jsoup.select.NodeTraversor
import org.jsoup.select.NodeVisitor
import org.junit.Assert
import org.junit.Assert.assertEquals
import org.junit.Test

class TestBackwardTraversor {

    @Test
    fun visitPathCompatible() {
        val page = ResourceLoader.getResourceAsStream("webpages/mia.com/00f3a63c4898d201df95d6015244dd63.html")!!
        val doc = Documents.parse(page, "UTF-8", "00f3a63c4898d201df95d6015244dd63.html")

        val id = "#item_price"
        val path = mutableListOf<String>()
        val backwardPath = mutableListOf<String>()

        // Forward traverse
        NodeTraversor.filter(object: NodeFilter {
            override fun head(node: Node, depth: Int): NodeFilter.FilterResult {
                return NodeFilter.FilterResult.CONTINUE
            }

            override fun tail(node: Node, depth: Int): NodeFilter.FilterResult {
                path.add(node.uniqueName)

                if (node is Element && node.children().any { "#${it.id()}" == id }) {
                    return NodeFilter.FilterResult.STOP
                }

                return NodeFilter.FilterResult.CONTINUE
            }
        }, doc.unbox())

        // Backward traverse
        BackwardNodeTraversor.traverse(NodeVisitor { node, depth ->
            assertEquals(node.depth, depth)
            backwardPath.add(node.uniqueName)
        }, doc.first(id)!!)

//        println(path.joinToString())
//        println(backwardPath.asReversed().joinToString())

        Assert.assertArrayEquals("Error in BackwardTraversor", path.toTypedArray(), backwardPath.asReversed().toTypedArray())
    }
}
