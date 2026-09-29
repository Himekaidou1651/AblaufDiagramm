/**
 * @file GraphCoreValidation.h
 * @brief 声明图核心输入数据校验接口。
 * @author 项目维护者
 * @date 2026-08-26
 */

#pragma once

#include "GraphCore.h"

#include <string>
#include <vector>

/**
 * @brief 校验图核心输入数据的索引和尺寸约束。
 * @param input 待校验的图核心输入数据。
 * @return 校验过程中产生的诊断信息列表；为空表示校验通过。
 */
std::vector<std::string> validateGraphCoreInput(const GraphCoreInput& input);
