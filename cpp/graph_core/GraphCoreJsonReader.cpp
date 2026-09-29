/**
 * @file GraphCoreJsonReader.cpp
 * @brief 实现图核心输入 JSON 的轻量解析逻辑。
 * @author 项目维护者
 * @date 2026-08-26
 */

#include "GraphCoreJsonReader.h"

#include <cctype>
#include <cmath>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

namespace {

/**
 * @class JsonReader
 * @brief 读取并解析图核心输入 JSON 的内部解析器。
 */
class JsonReader {
public:
  /**
   * @brief 使用 JSON 源字符串创建解析器。
   * @param source 待解析的 JSON 源字符串。
   */
  explicit JsonReader(const std::string& source) : source_(source) {}

  /**
   * @brief 解析完整的图核心输入对象。
   * @return 解析后的图核心输入数据。
   */
  GraphCoreInput parseGraphCoreInput() {
    GraphCoreInput input;

    expect('{');
    bool first = true;
    while (!consume('}')) {
      if (!first) {
        expect(',');
      }
      first = false;

      const std::string key = parseString();
      expect(':');

      if (key == "nodes") {
        input.nodes = parseNodes();
      } else if (key == "edges") {
        input.edges = parseEdges();
      } else {
        skipValue();
      }
    }

    skipWhitespace();
    if (!isEnd()) {
      fail("unexpected trailing content");
    }

    return input;
  }

private:
  /**
   * @brief 解析节点数组。
   * @return 解析后的输入节点列表。
   */
  std::vector<InputNode> parseNodes() {
    std::vector<InputNode> nodes;
    expect('[');
    bool first = true;
    while (!consume(']')) {
      if (!first) {
        expect(',');
      }
      first = false;
      nodes.push_back(parseNode());
    }
    return nodes;
  }

  /**
   * @brief 解析单个节点对象。
   * @return 解析后的输入节点数据。
   */
  InputNode parseNode() {
    InputNode node;
    expect('{');
    bool first = true;
    while (!consume('}')) {
      if (!first) {
        expect(',');
      }
      first = false;

      const std::string key = parseString();
      expect(':');

      if (key == "node_index") {
        node.node_index = parseInt();
      } else if (key == "width") {
        node.width = parseNumber();
      } else if (key == "height") {
        node.height = parseNumber();
      } else if (key == "hasAvatar") {
        node.hasAvatar = parseBool();
      } else {
        skipValue();
      }
    }
    return node;
  }

  /**
   * @brief 解析边数组。
   * @return 解析后的输入边列表。
   */
  std::vector<InputEdge> parseEdges() {
    std::vector<InputEdge> edges;
    expect('[');
    bool first = true;
    while (!consume(']')) {
      if (!first) {
        expect(',');
      }
      first = false;
      edges.push_back(parseEdge());
    }
    return edges;
  }

  /**
   * @brief 解析单条边对象。
   * @return 解析后的输入边数据。
   */
  InputEdge parseEdge() {
    InputEdge edge;
    expect('{');
    bool first = true;
    while (!consume('}')) {
      if (!first) {
        expect(',');
      }
      first = false;

      const std::string key = parseString();
      expect(':');

      if (key == "edge_index") {
        edge.edge_index = parseInt();
      } else if (key == "source") {
        edge.source = parseInt();
      } else if (key == "target") {
        edge.target = parseInt();
      } else if (key == "type") {
        edge.type = parseEdgeType();
      } else {
        skipValue();
      }
    }
    return edge;
  }

  /**
   * @brief 解析边类型枚举值。
   * @return 解析后的边类型。
   */
  EdgeType parseEdgeType() {
    const int value = parseInt();
    if (value == 0) {
      return EdgeType::Parent;
    }
    if (value == 1) {
      return EdgeType::Spouse;
    }
    fail("edge type must be 0 or 1");
  }

  /**
   * @brief 解析 JSON 字符串值。
   * @return 解析后的字符串内容。
   */
  std::string parseString() {
    skipWhitespace();
    expectRaw('"');
    std::string value;

    while (!isEnd()) {
      const char c = advance();
      if (c == '"') {
        return value;
      }
      if (c == '\\') {
        if (isEnd()) {
          fail("unterminated escape sequence");
        }
        const char escaped = advance();
        switch (escaped) {
          case '"':
          case '\\':
          case '/':
            value.push_back(escaped);
            break;
          case 'b':
            value.push_back('\b');
            break;
          case 'f':
            value.push_back('\f');
            break;
          case 'n':
            value.push_back('\n');
            break;
          case 'r':
            value.push_back('\r');
            break;
          case 't':
            value.push_back('\t');
            break;
          default:
            fail("unsupported escape sequence");
        }
      } else {
        value.push_back(c);
      }
    }

    fail("unterminated string");
  }

  /**
   * @brief 解析整数值。
   * @return 解析后的整数。
   */
  int parseInt() {
    const double value = parseNumber();
    if (std::floor(value) != value) {
      fail("expected integer");
    }
    return static_cast<int>(value);
  }

  /**
   * @brief 解析数字值。
   * @return 解析后的浮点数。
   */
  double parseNumber() {
    skipWhitespace();
    const std::size_t start = position_;

    if (peek() == '-') {
      ++position_;
    }
    consumeDigits();
    if (peek() == '.') {
      ++position_;
      consumeDigits();
    }
    if (peek() == 'e' || peek() == 'E') {
      ++position_;
      if (peek() == '+' || peek() == '-') {
        ++position_;
      }
      consumeDigits();
    }

    if (start == position_) {
      fail("expected number");
    }

    return std::stod(source_.substr(start, position_ - start));
  }

  /**
   * @brief 解析布尔值。
   * @return 解析后的布尔值。
   */
  bool parseBool() {
    skipWhitespace();
    if (match("true")) {
      return true;
    }
    if (match("false")) {
      return false;
    }
    fail("expected boolean");
  }

  /**
   * @brief 跳过当前未知 JSON 值。
   * @return 无返回值。
   */
  void skipValue() {
    skipWhitespace();
    const char c = peek();
    if (c == '"') {
      parseString();
      return;
    }
    if (c == '{') {
      expect('{');
      bool first = true;
      while (!consume('}')) {
        if (!first) {
          expect(',');
        }
        first = false;
        parseString();
        expect(':');
        skipValue();
      }
      return;
    }
    if (c == '[') {
      expect('[');
      bool first = true;
      while (!consume(']')) {
        if (!first) {
          expect(',');
        }
        first = false;
        skipValue();
      }
      return;
    }
    if (c == 't' || c == 'f') {
      parseBool();
      return;
    }
    if (c == 'n') {
      if (!match("null")) {
        fail("expected null");
      }
      return;
    }
    parseNumber();
  }

  /**
   * @brief 跳过空白后读取期望字符。
   * @param expected 期望读取的字符。
   * @return 无返回值。
   */
  void expect(char expected) {
    skipWhitespace();
    expectRaw(expected);
  }

  /**
   * @brief 在当前位置直接读取期望字符。
   * @param expected 期望读取的字符。
   * @return 无返回值。
   */
  void expectRaw(char expected) {
    if (isEnd() || source_[position_] != expected) {
      std::ostringstream message;
      message << "expected '" << expected << "'";
      fail(message.str());
    }
    ++position_;
  }

  /**
   * @brief 跳过空白后尝试消费指定字符。
   * @param expected 期望消费的字符。
   * @return 成功消费时返回 true，否则返回 false。
   */
  bool consume(char expected) {
    skipWhitespace();
    if (!isEnd() && source_[position_] == expected) {
      ++position_;
      return true;
    }
    return false;
  }

  /**
   * @brief 跳过空白后匹配指定文本。
   * @param text 期望匹配的文本。
   * @return 成功匹配时返回 true，否则返回 false。
   */
  bool match(const char* text) {
    skipWhitespace();
    const std::string token(text);
    if (source_.compare(position_, token.size(), token) == 0) {
      position_ += token.size();
      return true;
    }
    return false;
  }

  /**
   * @brief 连续消费一个或多个数字字符。
   * @return 无返回值。
   */
  void consumeDigits() {
    const std::size_t start = position_;
    while (std::isdigit(static_cast<unsigned char>(peek()))) {
      ++position_;
    }
    if (start == position_) {
      fail("expected digit");
    }
  }

  /**
   * @brief 跳过当前位置之后的空白字符。
   * @return 无返回值。
   */
  void skipWhitespace() {
    while (!isEnd() && std::isspace(static_cast<unsigned char>(source_[position_]))) {
      ++position_;
    }
  }

  /**
   * @brief 查看当前位置字符。
   * @return 当前字符；到达末尾时返回空字符。
   */
  char peek() const {
    return isEnd() ? '\0' : source_[position_];
  }

  /**
   * @brief 返回当前位置字符并前进一个位置。
   * @return 前进前当前位置的字符。
   */
  char advance() {
    return source_[position_++];
  }

  /**
   * @brief 判断解析位置是否到达源字符串末尾。
   * @return 到达末尾时返回 true，否则返回 false。
   */
  bool isEnd() const {
    return position_ >= source_.size();
  }

  /**
   * @brief 抛出带当前位置的解析错误。
   * @param message 基础错误信息。
   * @return 此函数不会返回。
   */
  [[noreturn]] void fail(const std::string& message) const {
    std::ostringstream fullMessage;
    fullMessage << message << " at offset " << position_;
    throw std::runtime_error(fullMessage.str());
  }

  const std::string& source_;
  std::size_t position_ = 0;
};

} // 匿名命名空间

/**
 * @brief 解析图核心输入 JSON 字符串。
 * @param source 待解析的 JSON 源字符串。
 * @return 解析后的图核心输入数据。
 */
GraphCoreInput parseGraphCoreInputJson(const std::string& source) {
  return JsonReader(source).parseGraphCoreInput();
}
