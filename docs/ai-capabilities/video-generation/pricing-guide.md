# Video Model Pricing Guide

## 💰 Price Comparison (Per Second)

### Budget Options (Non-VIP)
- **LTX** (`comfyui/ltx`) - **$0.40/sec** ⭐ *Best Value*
- **LipSync** (`comfyui/lip-sync`) - **$0.40/sec**

### Mid-Range Options (VIP Required)
- **KLING 2.1 Standard** - **$1.00/sec**
- **Minimax** - **$1.20/sec**
- **Minimax Live** - **$1.20/sec**
- **KLING 2.1 Pro** - **$2.00/sec**

### Premium Options (VIP Required)
- **Google VEO2** - **$2.00/sec**
- **OpenAI Sora** - **$2.00/sec** ⭐ *Longest Duration*
- **Google VEO3** - **$3.00/sec** ⭐ *Best Quality*

## 📏 Duration Support

### Short Videos (5 seconds)
- **LTX** - $2.00 total
- **Minimax** - $6.00 total
- **KLING Standard** - $5.00 total
- **VEO2** - $10.00 total
- **Sora** - $10.00 total
- **VEO3** - $15.00 total

### Medium Videos (8 seconds)
- **VEO2** - $16.00 total
- **Sora** - $16.00 total
- **VEO3** - $24.00 total

### Long Videos (10 seconds)
- **KLING Standard** - $10.00 total
- **Sora** - $20.00 total
- **KLING Pro** - $20.00 total

### Extended Videos (15-20 seconds)
- **Sora only** - $30-40 total

## 🎯 Recommendations by Use Case

### **Budget-Conscious ($0.40-0.50/sec)**
```typescript
await findBestVideoModel({
  maxPrice: 0.5,
  vipAllowed: false
});
// Returns: comfyui/ltx
```

### **Balanced Quality/Price ($1-2/sec)**
```typescript
await findBestVideoModel({
  maxPrice: 2.0,
  vipAllowed: true
});
// Returns: fal-ai/kling-video/v2.1/standard/image-to-video or azure-openai/sora
```

### **Premium Quality ($2-3/sec)**
```typescript
await findBestVideoModel({
  maxPrice: 3.0,
  prioritizeQuality: true,
  vipAllowed: true
});
// Returns: google-cloud/veo3
```

### **Maximum Duration (up to 20s)**
```typescript
await findBestVideoModel({
  preferredDuration: 15,
  maxPrice: 2.0,
  vipAllowed: true
});
// Returns: azure-openai/sora
```

## 🔐 VIP Requirements

### **Non-VIP Models** (Anyone can use)
- LTX ($0.40/sec)
- LipSync ($0.40/sec)

### **VIP Required Models** (Premium subscription needed)
- All Google VEO models
- All KLING models  
- All Minimax models
- OpenAI Sora

## 💡 Cost Optimization Tips

### **For Agents:**
1. **Always check budget first** - Use `maxPrice` parameter
2. **Consider duration** - Longer videos cost exponentially more
3. **VIP awareness** - Filter out VIP models for non-premium users
4. **Quality vs Cost** - LTX offers 80% quality at 13% of VEO3 cost

### **Example Cost-Aware Selection:**
```typescript
// Smart budget selection
const userBudget = 5.00; // $5 total budget
const desiredDuration = 10; // 10 seconds

const maxPricePerSecond = userBudget / desiredDuration; // $0.50/sec

const model = await findBestVideoModel({
  maxPrice: maxPricePerSecond,
  preferredDuration: desiredDuration,
  vipAllowed: userHasVIP
});

if (model.success) {
  const totalCost = model.data.price_per_second * desiredDuration;
  console.log(`Selected ${model.data.label} - Total cost: $${totalCost}`);
}
```

## 📊 Value Analysis

### **Best Value: LTX**
- **Cost**: $0.40/sec
- **Quality**: High
- **Availability**: No VIP required
- **Use case**: Most general video generation

### **Best Quality: VEO3**
- **Cost**: $3.00/sec (7.5x more than LTX)
- **Quality**: Premium
- **Availability**: VIP required
- **Use case**: Professional/commercial content

### **Best Duration: Sora**
- **Cost**: $2.00/sec (5x more than LTX)
- **Quality**: High
- **Duration**: Up to 20 seconds
- **Use case**: Long-form content, storytelling

## 🎬 Model Selection Matrix

| Budget | Duration | VIP | Recommended Model | Cost (5s) |
|--------|----------|-----|-------------------|-----------|
| Low | Short | No | LTX | $2.00 |
| Medium | Short | Yes | KLING Standard | $5.00 |
| High | Short | Yes | VEO3 | $15.00 |
| Medium | Medium | Yes | VEO2/Sora | $16.00 |
| High | Long | Yes | Sora | $30.00+ | 