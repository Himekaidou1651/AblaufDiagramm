/**
 * @file GraphCoreDebugFormat.cpp
 * @brief 实现图核心相关对象的调试输出格式。
 * @author 项目维护者
 * @date 2026-08-26
 */

#include "GraphCoreDebugFormat.h"

#include <ostream>

/**
 * @brief 将边类型写入输出流。
 * @param out 目标输出流。
 * @param type 待写入的边类型。
 * @return 写入后的输出流引用。
 */
std::ostream& operator<<(std::ostream& out, EdgeType type) {
  switch (type) {
    case EdgeType::Parent:
      out << "Parent";
      break;
    case EdgeType::Spouse:
      out << "Spouse";
      break;
  }
  return out;
}

/**
 * @brief 将节点信息写入输出流。
 * @param out 目标输出流。
 * @param node 待写入的节点对象。
 * @return 写入后的输出流引用。
 */
std::ostream& operator<<(std::ostream& out, const Node& node) {
  out << "Node {"
      << "node_index = " << node.node_index
      << ", width = " << node.width
      << ", height = " << node.height
      << ", hasAvatar = " << (node.hasAvatar ? "true" : "false")
      << " }";
  return out;
}

/**
 * @brief 将边信息写入输出流。
 * @param out 目标输出流。
 * @param edge 待写入的边对象。
 * @return 写入后的输出流引用。
 */
std::ostream& operator<<(std::ostream& out, const Edge& edge) {
  out << "Edge {"
      << "edge_index = " << edge.edge_index
      << ", source = " << edge.source
      << ", target = " << edge.target
      << ", type = " << edge.type
      << " }";
  return out;
}

/**
 * @brief 将图核心摘要和明细写入输出流。
 * @param out 目标输出流。
 * @param graphCore 待写入的图核心对象。
 * @return 写入后的输出流引用。
 */
std::ostream& operator<<(std::ostream& out, const GraphCore& graphCore) {
  out << "GraphCore {nodeCount = " << graphCore.nodeCount()
      << ", edgeCount = " << graphCore.edgeCount()
      << " }\n";

  out << "nodes:\n";
  if (graphCore.nodes.empty()) {
    out << "  <empty>\n";
  } else {
    for (std::size_t i = 0; i < graphCore.nodes.size(); ++i) {
      out << "  [" << i << "] ";
      if (graphCore.nodes[i]) {
        out << *graphCore.nodes[i];
      } else {
        out << "<null>";
      }
      out << "\n";
    }
  }

  out << "edges:\n";
  if (graphCore.edges.empty()) {
    out << "  <empty>";
  } else {
    for (std::size_t i = 0; i < graphCore.edges.size(); ++i) {
      out << "  [" << i << "] ";
      if (graphCore.edges[i]) {
        out << *graphCore.edges[i];
      } else {
        out << "<null>";
      }
      if (i + 1 < graphCore.edges.size()) {
        out << "\n";
      }
    }
  }

  return out;
}
